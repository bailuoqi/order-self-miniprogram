import { Controller, Get, Post, Body, Param, UseGuards, Req, RawBodyRequest } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaymentService } from './payment.service';
import { PaymentStage } from './transaction.entity';

@Controller('payment')
export class PaymentController {
  constructor(private service: PaymentService) {}

  /** 微信支付（stage: deposit=定金, final=尾款） */
  @Post('wxpay')
  @UseGuards(JwtAuthGuard)
  wxPay(@CurrentUser() user: any, @Body() body: { order_id: number; stage?: string }) {
    const stage = body.stage === 'final' ? PaymentStage.FINAL : PaymentStage.DEPOSIT;
    return this.service.wxPayOrder(user.id, body.order_id, stage, user.openid);
  }

  @Post('wxpay/notify')
  async wxPayNotify(@Req() req: RawBodyRequest<Request>) {
    const xml = req.body?.toString() || '';
    return this.service.wxPayCallback(xml);
  }

  /** 开发环境模拟支付 */
  @Post('mock')
  @UseGuards(JwtAuthGuard)
  mockPay(@CurrentUser() user: any, @Body() body: { order_id: number; stage?: string }) {
    const stage = body.stage === 'final' ? PaymentStage.FINAL : PaymentStage.DEPOSIT;
    return this.service.mockPay(user.id, body.order_id, stage);
  }

  /** Admin: 订单支付记录 */
  @Get('order/:orderId')
  @UseGuards(AdminAuthGuard)
  byOrder(@Param('orderId') orderId: string) {
    return this.service.findByOrder(+orderId);
  }
}
