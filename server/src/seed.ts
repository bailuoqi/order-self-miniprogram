import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '..', '.env.dev') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { Category } from './modules/category/category.entity';
import { Product } from './modules/product/product.entity';
import { CmsArticle } from './modules/cms/cms-article.entity';

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

  // 标准服务（价格单位：分）
  const products = await ds.getRepository(Product).save([
    { category_id: cats[0].id, title: '微信小程序定制开发', description: '按需求定制微信小程序：预约、展示、管理类均可，含前后端与部署，先报价后开工', cover: '', price: 299900, original_price: 399900, sold_count: 56, delivery_days: '15-30天', tags: ['热门'], status: 1, sort: 1 },
    { category_id: cats[1].id, title: '企业官网/管理系统开发', description: '响应式官网或后台管理系统，Vue3 + NestJS 技术栈，交付源码', cover: '', price: 350000, sold_count: 38, delivery_days: '10-20天', tags: [], status: 1, sort: 2 },
    { category_id: cats[2].id, title: '自动化脚本/效率工具', description: 'Python/Node 自动化脚本、数据处理、办公效率工具定制（合法合规用途）', cover: '', price: 30000, sold_count: 112, delivery_days: '3-7天', tags: ['热门'], status: 1, sort: 3 },
    { category_id: cats[3].id, title: 'API 接口对接/联调', description: '第三方平台接口对接：支付、物流、短信、开放平台等', cover: '', price: 50000, sold_count: 64, delivery_days: '3-7天', tags: [], status: 1, sort: 4 },
    { category_id: cats[4].id, title: '现有系统二次开发', description: '在你现有系统上加功能、改流程、修问题，先评估再报价', cover: '', price: 80000, sold_count: 41, delivery_days: '视需求评估', tags: [], status: 1, sort: 5 },
    { category_id: cats[5].id, title: 'PCB 打样 + SMT 贴片', description: '双层/四层板打样，可代购元器件并贴片焊接，附测试报告', cover: '', price: 15000, sold_count: 87, delivery_days: '5-10天', tags: ['热门'], status: 1, sort: 6 },
    { category_id: cats[6].id, title: '电子模块焊接组装', description: '插件/贴片焊接、线束加工、整机组装与老化测试', cover: '', price: 8000, sold_count: 95, delivery_days: '3-7天', tags: [], status: 1, sort: 7 },
    { category_id: cats[7].id, title: 'STM32/Arduino 单片机开发', description: '单片机程序开发与调试：传感器采集、电机控制、通信协议等', cover: '', price: 60000, sold_count: 73, delivery_days: '7-15天', tags: ['热门'], status: 1, sort: 8 },
    { category_id: cats[8].id, title: '电路原理图/PCB 设计', description: '原理图设计、PCB Layout、BOM 表输出，支持改版迭代', cover: '', price: 40000, sold_count: 52, delivery_days: '5-10天', tags: [], status: 1, sort: 9 },
    { category_id: cats[9].id, title: '样机打样与功能验证', description: '从设计到样机：打样、组装、烧录、功能验证一条龙', cover: '', price: 100000, sold_count: 29, delivery_days: '10-20天', tags: [], status: 1, sort: 10 },
  ]);
  console.log(products.length + ' 个标准服务');

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
