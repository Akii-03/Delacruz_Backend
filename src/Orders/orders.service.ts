import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, OkPacket } from 'mysql2';

@Injectable()
export class OrdersService {
  constructor(private db: DatabaseService) {}

  private pool = () => this.db.getPool();

  async getAll() {
    const sql = `
      SELECT o.*, c.first_name, c.last_name, a.street, a.city 
      FROM orders o
      JOIN customer c ON o.customer_id = c.customer_id
      JOIN addresses a ON o.address_num = a.address_num
    `;
    const [rows] = await this.pool().query(sql);
    return rows;
  }

  async findById(order_id: number) {
    const sql = `
      SELECT o.*, c.first_name, c.last_name, a.street, a.city, a.province, a.zip_code
      FROM orders o
      JOIN customer c ON o.customer_id = c.customer_id
      JOIN addresses a ON o.address_num = a.address_num
      WHERE o.order_id = ?
    `;
    const [rows] = await this.pool().execute<RowDataPacket[]>(sql, [order_id]);
    return rows[0] || null;
  }

  async findByOrderId(customer_id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT * FROM orders WHERE customer_id = ? ORDER BY order_date DESC',
      [customer_id],
    );
    return rows;
  }

  async createOrder(customer_id: number, address_num: number, total_price: number, order_status?: string) {
    const [result] = await this.pool().execute<OkPacket>(
      'INSERT INTO orders (customer_id, address_num, total_price, order_status) VALUES (?, ?, ?, ?)',
      [customer_id, address_num, total_price, order_status || 'Pending'],
    );
    return this.findById(result.insertId);
  }

  async updateOrder(order_id: number, order_status: string) {
    await this.pool().execute('UPDATE orders SET order_status = ? WHERE order_id = ?', [order_status, order_id]);
    return this.findById(order_id);
  }

  async deleteOrder(order_id: number) {
    const [res] = await this.pool().execute<OkPacket>('DELETE FROM orders WHERE order_id = ?', [order_id]);
    return res.affectedRows > 0;
  }
}