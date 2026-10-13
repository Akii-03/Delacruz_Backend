import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, OkPacket } from 'mysql2';

@Injectable()
export class PaymentsService {
  constructor(private db: DatabaseService) {}

  private pool = () => this.db.getPool();

  async findAll() {
    const [rows] = await this.pool().query('SELECT * FROM payments');
    return rows;
  }

  async findById(payment_id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT * FROM payments WHERE payment_id = ?',
      [payment_id],
    );
    return rows[0] || null;
  }

  async findByOrderId(order_id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT * FROM payments WHERE order_id = ?',
      [order_id],
    );
    return rows[0] || null;
  }

  async createPayment(order_id: number, payment_method: string, amount_paid: number, payment_status?: string) {
    const [result] = await this.pool().execute<OkPacket>(
      'INSERT INTO payments (order_id, payment_method, amount_paid, payment_status) VALUES (?, ?, ?, ?)',
      [order_id, payment_method, amount_paid, payment_status || 'Pending'],
    );
    return this.findById(result.insertId);
  }

async updatePayments(payment_id: number, partial: { amount_paid: number; payment_status: string; payment_method: string; }, amount_paid: number) {
    const fields: string[] = [];
    const values: any[] = [];

    if (partial.amount_paid !== undefined) { fields.push('amount_paid = ?'); values.push(partial.amount_paid); }
    if (partial.payment_status !== undefined) { fields.push('payment_status = ?'); values.push(partial.payment_status); }
    if (partial.payment_method !== undefined) { fields.push('payment_method = ?'); values.push(partial.payment_method); }

    if (fields.length === 0) return this.findById(payment_id);

    values.push(payment_id);
    await this.pool().execute(`UPDATE payments SET ${fields.join(', ')} WHERE payment_id = ?`, values);
    return this.findById(payment_id);
  }

  async deletePayments(payment_id: number) {
    const [res] = await this.pool().execute<OkPacket>('DELETE FROM payments WHERE payment_id = ?', [payment_id]);
    return res.affectedRows > 0;
  }
}