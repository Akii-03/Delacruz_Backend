import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { DatabaseModule } from '../database/database.module';
import { OrderItemsModule } from '../OrderItems/ordersItems.module';

@Module({
    imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    forwardRef(() => OrderItemsModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}