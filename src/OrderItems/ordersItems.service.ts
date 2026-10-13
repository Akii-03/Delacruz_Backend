import { Injectable, Inject, NotFoundException, forwardRef} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, OkPacket } from 'mysql2';
import { OrdersService } from '../Orders/orders.service';

@Injectable()
export class OrderItemsService {
  constructor(
    private db: DatabaseService,
    @Inject(forwardRef(() => OrdersService))
    private OrdersService: OrdersService,
  ) {}

  private pool = () => this.db.getPool();

  async findByOrderId(order_id: number) {
    const sql = `
      SELECT oi.*, p.product_name, p.description 
      FROM orderItems oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `;
    const [rows] = await this.pool().execute<RowDataPacket[]>(sql, [order_id]);
    return rows;
  }

  async findById(order_item_id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT * FROM orderItems WHERE order_item_id = ?',
      [order_item_id],
    );
    return rows[0] || null;
  }

  async createOrderItem(order_id: number, product_id: number, quantity: number, price_at_purchase: number) {
    const [result] = await this.pool().execute<OkPacket>(
      'INSERT INTO orderItems (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
      [order_id, product_id, quantity, price_at_purchase],
    );
    return this.findById(result.insertId);
  }

  async update(order_item_id: number, partial: { quantity?: number; price_at_purchase?: number }) {
    const fields: string[] = [];
    const values: any[] = [];

    if (partial.quantity !== undefined) { fields.push('quantity = ?'); values.push(partial.quantity); }
    if (partial.price_at_purchase !== undefined) { fields.push('price_at_purchase = ?'); values.push(partial.price_at_purchase); }

    if (fields.length === 0) return this.findById(order_item_id);

    values.push(order_item_id);
    await this.pool().execute(`UPDATE orderItems SET ${fields.join(', ')} WHERE order_item_id = ?`, values);
    return this.findById(order_item_id);
  }

  async delete(order_item_id: number) {
    const [res] = await this.pool().execute<OkPacket>('DELETE FROM orderItems WHERE order_item_id = ?', [order_item_id]);
    return res.affectedRows > 0;
  }
}