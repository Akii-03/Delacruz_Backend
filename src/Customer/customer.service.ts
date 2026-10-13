import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, OkPacket } from 'mysql2';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class CustomerService {
  constructor(private db: DatabaseService) {}

  private pool = () => this.db.getPool();

  async createCustomer (first_name: string, last_name: string, email: string, password: string, phone_number?: number) {
    const hashed = await bcrypt.hash(password, 10);

    const [result] = await this.pool().execute<OkPacket>(
      'INSERT INTO customer (first_name, last_name, email, password, phone_number) VALUES (?, ?, ?, ?, ?)',
      [first_name, last_name, email, hashed, Number(phone_number)],
    );
    return this.findById(result.insertId);
  }

  async getAll() {
    const [rows] = await this.pool().query<RowDataPacket[]>(
      'SELECT * FROM customer',
    );
    return rows;
  }

  async findById(id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT customer_id, first_name, last_name, email, phone_number, date_joined FROM customer WHERE customer_id = ?',
      [id],
    );
    return rows[0] || null;
  }


  async updateCustomer(id: number, partial: { first_name?: string; last_name?: string; email?: string; phone_number?: string }) {
    const fields: string[] = [];
    const values: any[] = [];

    if (partial.first_name) { fields.push('first_name = ?'); values.push(partial.first_name); }
    if (partial.last_name) { fields.push('last_name = ?'); values.push(partial.last_name); }
    if (partial.email) { fields.push('email = ?'); values.push(partial.email); }
    if (partial.phone_number) { fields.push('phone_number = ?'); values.push(partial.phone_number); }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    await this.pool().execute(`UPDATE customer SET ${fields.join(', ')} WHERE customer_id = ?`, values);
    return this.findById(id);
  }

  async deleteCustomer(id: number) {
    const [res] = await this.pool().execute<OkPacket>('DELETE FROM customer WHERE customer_id = ?', [id]);
    return res.affectedRows > 0;
  }
}

