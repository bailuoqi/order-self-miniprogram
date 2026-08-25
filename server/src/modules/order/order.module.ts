import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { OrderLog } from './order-log.entity';
import { OrderQuote } from './order-quote.entity';
import { Product } from '../product/product.entity';
import { Category } from '../category/category.entity';
import { User } from '../user/user.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderLog, OrderQuote, Product, Category, User])],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
