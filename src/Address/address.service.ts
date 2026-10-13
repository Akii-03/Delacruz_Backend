import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, OkPacket } from 'mysql2';


@Injectable()
export class AddressService {
  constructor(private db: DatabaseService) {}

  private pool = () => this.db.getPool();

async createAddress (customer_id: number, street: string, city: string, province: string, zip_code: string) {
    const [result] = await this.pool().execute<OkPacket>(
      'INSERT INTO addresses (customer_id, street, city, province, zip_code) VALUES (?, ?, ?, ?, ?)',
      [customer_id, street, city, province, zip_code],
    );
    return this.findById(result.insertId);
  }

  async getAll() {
    const [rows] = await this.pool().query('SELECT * FROM addresses');
    return rows;
  }

  async findById(address_num: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT * FROM addresses WHERE address_num = ?',
      [address_num],
    );
    return rows[0] || null;
  }

  async findByUserId(customer_id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT * FROM addresses WHERE customer_id = ?',
      [customer_id],
    );
    return rows;
  }


  async update(address_num: number, partial : { street?: string; city?: string; province?: string; zip_code?: string }) {
    const fields: string[] = [];
    const values: any[] = [];

    if (partial.street) { fields.push('street = ?'); values.push(partial.street); }
    if (partial.city) { fields.push('city = ?'); values.push(partial.city); }
    if (partial.province) { fields.push('province = ?'); values.push(partial.province); }
    if (partial.zip_code) { fields.push('zip_code = ?'); values.push(partial.zip_code); }

    if (fields.length === 0) return this.findById(address_num);

    values.push(address_num);
    await this.pool().execute(`UPDATE addresses SET ${fields.join(', ')} WHERE address_num = ?`, values);
    return this.findById(address_num);
  }

  async deleteAddress(address_num: number) {
    const [res] = await this.pool().execute<OkPacket>('DELETE FROM addresses WHERE address_num = ?', [address_num]);
    return res.affectedRows > 0;
  }
}