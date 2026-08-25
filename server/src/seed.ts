import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '..', '.env.dev') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { Category } from './modules/category/category.entity';
import { Product } from './modules/product/product.entity';
import { CmsArticle } from './modules/cms/cms-article.entity';
import { User } from './modules/user/user.entity';
import { Order, OrderStatus, OrderSource } from './modules/order/order.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const ds = app.get(DataSource);

  console.log('🌱 开始播种测试数据...');

  // 分类（软件定制 / 电子代做）
  const cats = await ds.getRepository(Category).save([
    { name: '小程序开发', group: 'software', icon: '', sort: 1, status: 1 },
    { name: '网站开发', group: 'software', icon: '', sort: 2, status: 1 },
    { name: '脚本/工具', group: 'software', icon: '', sort: 3, status: 1 },
    { name: '接口对接', group: 'software', icon: '', sort: 4, status: 1 },
    { name: '系统二次开发', group: 'software', icon: '', sort: 5, status: 1 },
    { name: 'PCB打样', group: 'electronics', icon: '', sort: 6, status: 1 },
    { name: '焊接组装', group: 'electronics', icon: '', sort: 7, status: 1 },
    { name: '单片机开发', group: 'electronics', icon: '', sort: 8, status: 1 },
    { name: '电路设计', group: 'electronics', icon: '', sort: 9, status: 1 },
    { name: '样机打样', group: 'electronics', icon: '', sort: 10, status: 1 },
  ]);
  console.log(cats.length + ' 个分类');

  // 标准服务（价格单位：分；每个分类 2-3 项，保证分类页/列表页有可浏览的密度）
  const products = await ds.getRepository(Product).save([
    // 小程序开发
    { category_id: cats[0].id, title: '微信小程序定制开发', description: '按需求定制微信小程序：预约、展示、管理类均可，含前后端与部署，先报价后开工', cover: '', price: 299900, original_price: 399900, sold_count: 56, delivery_days: '15-30天', tags: ['热门'], status: 1, sort: 1 },
    { category_id: cats[0].id, title: '小程序商城搭建（含支付）', description: '商品、购物车、订单、微信支付全流程，含管理后台与部署上线，交付源码', cover: '', price: 499900, sold_count: 23, delivery_days: '20-40天', tags: ['含支付'], status: 1, sort: 2 },
    { category_id: cats[0].id, title: '预约/报名小程序', description: '门店预约、活动报名、课程约课类小程序，含通知提醒与后台核销', cover: '', price: 199900, sold_count: 31, delivery_days: '10-20天', tags: [], status: 1, sort: 3 },
    // 网站开发
    { category_id: cats[1].id, title: '企业官网/管理系统开发', description: '响应式官网或后台管理系统，Vue3 + NestJS 技术栈，交付源码', cover: '', price: 350000, sold_count: 38, delivery_days: '10-20天', tags: [], status: 1, sort: 4 },
    { category_id: cats[1].id, title: '响应式企业官网', description: '桌面/手机自适应官网：首页、产品、案例、联系我们，含基础 SEO 与备案协助', cover: '', price: 168000, sold_count: 47, delivery_days: '7-15天', tags: ['热门'], status: 1, sort: 5 },
    { category_id: cats[1].id, title: '后台管理系统开发', description: '权限、报表、审批流等企业内部系统，按模块报价，支持后续迭代维护', cover: '', price: 420000, sold_count: 19, delivery_days: '15-30天', tags: [], status: 1, sort: 6 },
    // 脚本/工具
    { category_id: cats[2].id, title: '自动化脚本/效率工具', description: 'Python/Node 自动化脚本、数据处理、办公效率工具定制（合法合规用途）', cover: '', price: 30000, sold_count: 112, delivery_days: '3-7天', tags: ['热门'], status: 1, sort: 7 },
    { category_id: cats[2].id, title: '数据采集与清洗脚本', description: '公开数据合规采集、格式清洗与导出报表，交付脚本源码与使用说明', cover: '', price: 45000, sold_count: 66, delivery_days: '3-7天', tags: [], status: 1, sort: 8 },
    { category_id: cats[2].id, title: 'Excel/办公自动化工具', description: '表格批处理、报表自动生成、文档批量转换，一次交付长期可用', cover: '', price: 25000, sold_count: 89, delivery_days: '2-5天', tags: [], status: 1, sort: 9 },
    // 接口对接
    { category_id: cats[3].id, title: 'API 接口对接/联调', description: '第三方平台接口对接：支付、物流、短信、开放平台等', cover: '', price: 50000, sold_count: 64, delivery_days: '3-7天', tags: [], status: 1, sort: 10 },
    { category_id: cats[3].id, title: '微信/支付宝支付接入', description: '小程序、H5、PC 网站支付能力接入与联调，含回调与对账处理', cover: '', price: 68000, sold_count: 58, delivery_days: '3-5天', tags: ['热门'], status: 1, sort: 11 },
    // 系统二次开发
    { category_id: cats[4].id, title: '现有系统二次开发', description: '在你现有系统上加功能、改流程、修问题，先评估再报价', cover: '', price: 80000, sold_count: 41, delivery_days: '视需求评估', tags: [], status: 1, sort: 12 },
    { category_id: cats[4].id, title: '开源系统部署与定制', description: '常见开源系统（商城/博客/工单等）部署上线与二次定制', cover: '', price: 60000, sold_count: 26, delivery_days: '5-10天', tags: [], status: 1, sort: 13 },
    // PCB打样
    { category_id: cats[5].id, title: 'PCB 打样 + SMT 贴片', description: '双层/四层板打样，可代购元器件并贴片焊接，附测试报告', cover: '', price: 15000, sold_count: 87, delivery_days: '5-10天', tags: ['热门'], status: 1, sort: 14 },
    { category_id: cats[5].id, title: '四层板设计打样加急', description: '四层板 Layout 检查、打样与贴片加急通道，适合赶节点的项目', cover: '', price: 28000, sold_count: 33, delivery_days: '3-5天', tags: ['加急'], status: 1, sort: 15 },
    // 焊接组装
    { category_id: cats[6].id, title: '电子模块焊接组装', description: '插件/贴片焊接、线束加工、整机组装与老化测试', cover: '', price: 8000, sold_count: 95, delivery_days: '3-7天', tags: [], status: 1, sort: 16 },
    { category_id: cats[6].id, title: '线束加工与整机装配', description: '按图纸加工线束、装配整机并做通电测试，小批量可接', cover: '', price: 12000, sold_count: 44, delivery_days: '3-7天', tags: [], status: 1, sort: 17 },
    // 单片机开发
    { category_id: cats[7].id, title: 'STM32/Arduino 单片机开发', description: '单片机程序开发与调试：传感器采集、电机控制、通信协议等', cover: '', price: 60000, sold_count: 73, delivery_days: '7-15天', tags: ['热门'], status: 1, sort: 18 },
    { category_id: cats[7].id, title: 'ESP32 物联网固件开发', description: 'WiFi/蓝牙联网、MQTT 上云、OTA 升级，交付固件源码与烧录说明', cover: '', price: 88000, sold_count: 37, delivery_days: '7-15天', tags: ['物联网'], status: 1, sort: 19 },
    { category_id: cats[7].id, title: '传感器采集与上位机', description: '多路传感器数据采集，配套 PC 上位机展示与导出，联调到可用为止', cover: '', price: 76000, sold_count: 21, delivery_days: '7-15天', tags: [], status: 1, sort: 20 },
    // 电路设计
    { category_id: cats[8].id, title: '电路原理图/PCB 设计', description: '原理图设计、PCB Layout、BOM 表输出，支持改版迭代', cover: '', price: 40000, sold_count: 52, delivery_days: '5-10天', tags: [], status: 1, sort: 21 },
    { category_id: cats[8].id, title: '电源电路设计与仿真', description: 'DC-DC/线性电源方案设计、仿真验证与样板调试', cover: '', price: 55000, sold_count: 18, delivery_days: '5-10天', tags: [], status: 1, sort: 22 },
    // 样机打样
    { category_id: cats[9].id, title: '样机打样与功能验证', description: '从设计到样机：打样、组装、烧录、功能验证一条龙', cover: '', price: 100000, sold_count: 29, delivery_days: '10-20天', tags: [], status: 1, sort: 23 },
    { category_id: cats[9].id, title: '外壳 3D 打印与结构装配', description: '外壳建模、3D 打印与结构装配，配合电路样机成套交付', cover: '', price: 35000, sold_count: 25, delivery_days: '5-8天', tags: [], status: 1, sort: 24 },
  ]);
  console.log(products.length + ' 个标准服务');

  // 演示用户（评价展示需要真实的 user 关联）
  const users = await ds.getRepository(User).save([
    { openid: 'demo_openid_reviewer_1', nickname: '林工', avatar: '' },
    { openid: 'demo_openid_reviewer_2', nickname: '陈同学', avatar: '' },
    { openid: 'demo_openid_reviewer_3', nickname: 'Kevin', avatar: '' },
    { openid: 'demo_openid_reviewer_4', nickname: '王经理', avatar: '' },
    { openid: 'demo_openid_reviewer_5', nickname: '晓峰', avatar: '' },
    { openid: 'demo_openid_reviewer_6', nickname: '阿哲', avatar: '' },
  ]);
  console.log(users.length + ' 个演示用户');

  // 已完成并带评价的订单（首页「客户评价」与服务详情评价区数据来源）
  // findReviews 只筛 review_score 非空，其余金额/时间字段按真实流程补齐
  const byTitle = (t: string) => products.find((p) => p.title === t)!;
  const reviewSeeds: Array<{ user: User; product: Product; score: number; content: string; daysAgo: number }> = [
    { user: users[0], product: byTitle('微信小程序定制开发'), score: 5, content: '沟通很顺畅，报价单列得清楚，小程序按约定时间上线，上线后的小问题也很快修掉了。', daysAgo: 3 },
    { user: users[1], product: byTitle('响应式企业官网'), score: 5, content: '官网比预期精致，手机端也适配得好，源码和部署文档都给全了，验收很省心。', daysAgo: 5 },
    { user: users[2], product: byTitle('自动化脚本/效率工具'), score: 5, content: '脚本跑得很稳，每天省下差不多两个小时的重复操作，物有所值。', daysAgo: 7 },
    { user: users[3], product: byTitle('微信/支付宝支付接入'), score: 5, content: '支付接口一次联调通过，回调和对账的文档留得很规范，后面自己维护也方便。', daysAgo: 9 },
    { user: users[4], product: byTitle('PCB 打样 + SMT 贴片'), score: 5, content: '板子打样质量不错，焊点整齐，随货附了测试报告，第二批还会再来。', daysAgo: 11 },
    { user: users[5], product: byTitle('STM32/Arduino 单片机开发'), score: 4, content: '固件逻辑比较复杂，中途改了两次需求，团队重新评估报价也很透明，最终效果满意。', daysAgo: 13 },
    { user: users[0], product: byTitle('电路原理图/PCB 设计'), score: 5, content: '原理图和 PCB 画得规范，BOM 表清楚，打样一版通过。', daysAgo: 16 },
    { user: users[1], product: byTitle('样机打样与功能验证'), score: 5, content: '样机功能验证一次通过，包装运输也很仔细，节点都有照片同步。', daysAgo: 18 },
    { user: users[2], product: byTitle('企业官网/管理系统开发'), score: 4, content: '管理系统交付后远程带着部署了一遍，权限配置讲得明白，售后响应快。', daysAgo: 21 },
    { user: users[3], product: byTitle('ESP32 物联网固件开发'), score: 5, content: 'ESP32 联网稳定，MQTT 和 OTA 都做好了，烧录说明写得很细。', daysAgo: 24 },
    { user: users[4], product: byTitle('预约/报名小程序'), score: 5, content: '从报价到交付全程走平台订单，定金尾款分两步，流程让人放心。', daysAgo: 27 },
    { user: users[5], product: byTitle('电子模块焊接组装'), score: 5, content: '焊接质量好，交期比约定还提前了两天，老化测试记录也发过来了。', daysAgo: 30 },
  ];

  const now = Date.now();
  const orderRows = reviewSeeds.map((r, i) => {
    const reviewedAt = new Date(now - r.daysAgo * 24 * 3600 * 1000);
    const deposit = Math.round(r.product.price * 0.3);
    return {
      order_no: `SEED${now}${String(i).padStart(2, '0')}`,
      user_id: r.user.id,
      source: OrderSource.PRODUCT,
      product_id: r.product.id,
      category_id: r.product.category_id,
      title: r.product.title,
      requirement: '演示订单：' + r.product.title,
      quote_amount: r.product.price,
      deposit_amount: deposit,
      final_amount: r.product.price - deposit,
      quote_days: r.product.delivery_days,
      quoted_at: new Date(reviewedAt.getTime() - 20 * 24 * 3600 * 1000),
      quote_confirmed_at: new Date(reviewedAt.getTime() - 19 * 24 * 3600 * 1000),
      deposit_paid_at: new Date(reviewedAt.getTime() - 18 * 24 * 3600 * 1000),
      delivered_at: new Date(reviewedAt.getTime() - 3 * 24 * 3600 * 1000),
      final_paid_at: new Date(reviewedAt.getTime() - 1 * 24 * 3600 * 1000),
      status: OrderStatus.COMPLETED,
      review_score: r.score,
      review_content: r.content,
      review_anonymous: 0,
      reviewed_at: reviewedAt,
      completed_at: reviewedAt,
    };
  });
  await ds.getRepository(Order).save(orderRows);
  console.log(orderRows.length + ' 条已完成订单（含评价）');

  // CMS公告
  await ds.getRepository(CmsArticle).save([
    { title: '定制接单工作室上线：软件定制 / 电子代做，先报价后开工', type: 'notice', content: '<p>我们是一个专注软件定制开发与电子产品代做的团队。下单后由团队报价，双方确认后支付定金开工，交付满意再结尾款。</p>', status: 1, sort: 1 },
    { title: '下单流程说明：下单 → 报价 → 定金 → 制作 → 交付 → 尾款 → 评价', type: 'notice', content: '<p>1. 提交需求（标准服务或自定义需求）；2. 团队评估后在订单里报价；3. 您确认报价并支付定金；4. 团队制作并交付成果；5. 您验收后支付尾款并评价。</p>', status: 1, sort: 2 },
  ]);
  console.log('CMS公告已创建');

  console.log('🎉 种子数据播种完成！');
  await app.close();
}

seed().catch(e => {
  console.error('播种失败:', e.message);
  process.exit(1);
});
