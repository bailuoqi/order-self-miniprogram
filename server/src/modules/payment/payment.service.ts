import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import { Transaction, TransactionType, TransactionStatus, PaymentStage } from './transaction.entity';
import { Order, OrderStatus } from '../order/order.entity';
import { OrderService } from '../order/order.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    private orderService: OrderService,
    @Inject('APP_CONFIG') private config: any,
  ) {}

  /** 校验订单当前可支付的阶段与金额 */
  private async resolvePayable(userId: number, orderId: number, stage: PaymentStage) {
    const order = await this.orderRepo.findOne({ where: { id: orderId, user_id: userId } });
    if (!order) throw new BadRequestException('订单不存在');
    if (stage === PaymentStage.DEPOSIT) {
      if (order.status !== OrderStatus.CONFIRMED) throw new BadRequestException('订单当前不可支付定金');
      if (!order.deposit_amount || order.deposit_amount <= 0) throw new BadRequestException('定金金额未设置');
      return { order, amount: order.deposit_amount };
    }
    if (order.status !== OrderStatus.DELIVERED) throw new BadRequestException('订单当前不可支付尾款');
    if (order.final_amount <= 0) throw new BadRequestException('该订单无需支付尾款');
    return { order, amount: order.final_amount };
  }

  /** 微信小程序支付 - 统一下单（定金/尾款） */
  async wxPayOrder(userId: number, orderId: number, stage: PaymentStage, openid: string) {
    const { order, amount } = await this.resolvePayable(userId, orderId, stage);

    // 创建交易记录（out_trade_no 用交易号，保证定金/尾款两笔独立）
    const tx = this.txRepo.create({
      transaction_no: this.generateTxNo(),
      user_id: userId,
      order_id: order.id,
      type: TransactionType.PAY,
      stage,
      amount,
      status: TransactionStatus.PENDING,
      pay_method: 'wechat',
    });
    await this.txRepo.save(tx);

    const wxConfig = this.config.wx;
    const stageText = stage === PaymentStage.DEPOSIT ? '定金' : '尾款';
    const params = {
      appid: wxConfig.appId,
      mch_id: wxConfig.mchId,
      nonce_str: this.randomStr(32),
      body: `${stageText}-${order.order_no}`,
      out_trade_no: tx.transaction_no,
      total_fee: amount, // 分
      spbill_create_ip: '127.0.0.1',
      notify_url: wxConfig.notifyUrl,
      trade_type: 'JSAPI',
      openid: openid,
    };

    const sign = this.wxSign(params, wxConfig.payKey);
    params['sign'] = sign;

    try {
      const xmlBody = this.toXml(params);
      const { data } = await axios.post('https://api.mch.weixin.qq.com/pay/unifiedorder', xmlBody, {
        headers: { 'Content-Type': 'text/xml' },
      });
      const result = this.parseXml(data);

      if (result.return_code !== 'SUCCESS' || result.result_code !== 'SUCCESS') {
        throw new BadRequestException(result.err_code_des || '支付请求失败');
      }

      // 生成小程序支付参数
      const payParams = {
        appId: wxConfig.appId,
        timeStamp: String(Math.floor(Date.now() / 1000)),
        nonceStr: this.randomStr(32),
        package: `prepay_id=${result.prepay_id}`,
        signType: 'MD5',
      };
      payParams['paySign'] = this.wxSign(payParams, wxConfig.payKey);

      return { payParams, transaction_no: tx.transaction_no };
    } catch (err) {
      throw new BadRequestException('支付请求失败: ' + err.message);
    }
  }

  /** 微信支付回调处理 */
  async wxPayCallback(xmlData: string) {
    const result = this.parseXml(xmlData);
    const wxConfig = this.config.wx;

    // 验签
    const sign = result.sign;
    delete result.sign;
    const calcSign = this.wxSign(result, wxConfig.payKey);
    if (sign !== calcSign) {
      return this.toXml({ return_code: 'FAIL', return_msg: '签名验证失败' });
    }

    if (result.return_code === 'SUCCESS' && result.result_code === 'SUCCESS') {
      const txNo = result.out_trade_no;
      const tx = await this.txRepo.findOne({ where: { transaction_no: txNo } });
      if (!tx) return this.toXml({ return_code: 'FAIL', return_msg: '交易不存在' });

      // 幂等：已成功则直接返回
      if (tx.status === TransactionStatus.SUCCESS) {
        return this.toXml({ return_code: 'SUCCESS', return_msg: 'OK' });
      }

      // 金额校验
      const notifyFee = parseInt(result.total_fee) || 0;
      if (notifyFee !== tx.amount) {
        return this.toXml({ return_code: 'FAIL', return_msg: '金额不匹配' });
      }

      tx.status = TransactionStatus.SUCCESS;
      tx.third_party_no = result.transaction_id;
      tx.raw_data = result;
      await this.txRepo.save(tx);

      await this.orderService.onPaymentSuccess(tx.order_id, tx.stage === PaymentStage.FINAL ? 'final' : 'deposit', result.transaction_id);
    }

    return this.toXml({ return_code: 'SUCCESS', return_msg: 'OK' });
  }

  /** 开发环境模拟支付：直接标记支付成功并推进订单状态 */
  async mockPay(userId: number, orderId: number, stage: PaymentStage) {
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException('生产环境不允许模拟支付');
    }
    const { order, amount } = await this.resolvePayable(userId, orderId, stage);

    const tx = this.txRepo.create({
      transaction_no: this.generateTxNo(),
      user_id: userId,
      order_id: order.id,
      type: TransactionType.PAY,
      stage,
      amount,
      status: TransactionStatus.SUCCESS,
      pay_method: 'mock',
      third_party_no: 'MOCK' + Date.now(),
    });
    await this.txRepo.save(tx);

    return this.orderService.onPaymentSuccess(order.id, stage === PaymentStage.FINAL ? 'final' : 'deposit');
  }

  /** 订单支付记录 */
  async findByOrder(orderId: number) {
    return this.txRepo.find({ where: { order_id: orderId }, order: { created_at: 'DESC' } });
  }

  /** 微信签名 */
  private wxSign(params: any, key: string): string {
    const sorted = Object.keys(params)
      .filter((k) => k !== 'sign' && params[k] !== '' && params[k] !== undefined && params[k] !== null)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&');
    return crypto.createHash('md5').update(`${sorted}&key=${key}`).digest('hex').toUpperCase();
  }

  private randomStr(len: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let str = '';
    for (let i = 0; i < len; i++) str += chars[Math.floor(Math.random() * chars.length)];
    return str;
  }

  private toXml(obj: any): string {
    let xml = '<xml>';
    for (const key in obj) xml += `<${key}><![CDATA[${obj[key]}]]></${key}>`;
    xml += '</xml>';
    return xml;
  }

  private parseXml(xml: string): any {
    const result: any = {};
    const regex = /<(\w+)><!\[CDATA\[(.*?)\]\]><\/\1>/g;
    let match: any;
    while ((match = regex.exec(xml)) !== null) result[match[1]] = match[2];
    return result;
  }

  private generateTxNo(): string {
    return 'TX' + Date.now() + uuid().replace(/-/g, '').slice(0, 8).toUpperCase();
  }
}
