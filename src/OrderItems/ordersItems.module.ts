import { Module, forwardRef} from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { OrderItemsController } from './ordersItems.controller';
import { DatabaseModule } from '../database/database.module';
import { OrderItemsService } from './ordersItems.service';
import { OrdersModule } from '../Orders/orders.module';

@Module({
    imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    forwardRef(() => OrdersModule),
  ],
  controllers: [OrderItemsController],
  providers: [OrderItemsService],
  exports: [OrderItemsService],
})
export class OrderItemsModule {}