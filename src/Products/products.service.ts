import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, OkPacket } from 'mysql2';

@Injectable()
export class ProductsService {
  constructor(private db: DatabaseService) {}

  private pool = () => this.db.getPool();

async createProduct(
  category_id: number,
  product_name: string,
  price: number,
  description: string,
  stock_qty: number,
) {
  const [result] = await this.pool().execute<OkPacket>(
    'INSERT INTO products (category_id, product_name, description, price, stock_qty) VALUES (?, ?, ?, ?, ?)',
    [
      category_id ?? null,
      product_name ?? null,
      description ?? null,
      price ?? null,
      stock_qty ?? 0,
    ],
  );
  return this.findById(result.insertId);
}


 async getAll() {
    const sql = `
      SELECT p.*, c.category_name 
      FROM products p 
      JOIN category c ON p.category_id = c.category_id
    `;
    const [rows] = await this.pool().query(sql);
    return rows;
  }

   async findByUserId(product_id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT * FROM addresses WHERE customer_id = ?',
      [product_id],
    );
    return rows;
  }

  async findById(product_id: number) {
    const sql = `
      SELECT p.*, c.category_name 
      FROM products p 
      JOIN category c ON p.category_id = c.category_id 
      WHERE p.product_id = ?
    `;
    const [rows] = await this.pool().execute<RowDataPacket[]>(sql, [product_id]);
    return rows[0] || null;
  }

  async updateProducts(product_id: number, partial: { category_id?: number; product_name?: string; description?: string; price?: number; stock_qty?: number }) {
    const fields: string[] = [];
    const values: any[] = [];

    if (partial.category_id !== undefined) { fields.push('category_id = ?'); values.push(partial.category_id); }
    if (partial.product_name) { fields.push('product_name = ?'); values.push(partial.product_name); }
    if (partial.description !== undefined) { fields.push('description = ?'); values.push(partial.description); }
    if (partial.price !== undefined) { fields.push('price = ?'); values.push(partial.price); }
    if (partial.stock_qty !== undefined) { fields.push('stock_qty = ?'); values.push(partial.stock_qty); }

    if (fields.length === 0) return this.findById(product_id);

    values.push(product_id);
    await this.pool().execute(`UPDATE products SET ${fields.join(', ')} WHERE product_id = ?`, values);
    return this.findById(product_id);
  }

  async deleteProducts(product_id: number) {
    const [res] = await this.pool().execute<OkPacket>('DELETE FROM products WHERE product_id = ?', [product_id]);
    return res.affectedRows > 0;;
  }

}