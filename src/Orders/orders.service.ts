import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, OkPacket, ResultSetHeader } from 'mysql2';

export interface CreateFullOrderDto {
  customer_id: number;
  address_num?: number;
  street?: string;
  city?: string;
  province?: string;
  zip_code?: string;
  total_price: number;
  order_status?: string;
  payment_method?: string;
  payment_status?: string;
  amount_paid?: number;
  items: {
    product_id: number;
    quantity: number;
    price_at_purchase: number;
  }[];
}

@Injectable()
export class OrdersService {
  constructor(private db: DatabaseService) {}

  private pool = () => this.db.getPool();

  /**
   * Resolves `customer_id` from `req.user` returned by JwtStrategy
   * (supports `userId`, `customer_id`, `sub`, `id`, or email/username lookup).
   */
  async resolveCustomerId(user: any): Promise<number> {
    if (!user) {
      throw new BadRequestException('Unauthenticated request: user missing from token.');
    }

    const directId =
      user.customer_id ?? user.customerId ?? user.userId ?? user.sub ?? user.id;

    if (directId !== undefined && directId !== null && !isNaN(Number(directId))) {
      return Number(directId);
    }

    const identifier = user.email || user.username;
    if (identifier) {
      const [rows] = await this.pool().execute<RowDataPacket[]>(
        'SELECT customer_id FROM customer WHERE email = ? LIMIT 1',
        [identifier],
      );
      if (rows.length > 0) {
        return Number(rows[0].customer_id);
      }
    }

    throw new BadRequestException(
      'Could not resolve customer_id from token. Ensure you are logged in as a Customer.',
    );
  }

  async getAll() {
    const sql = `
      SELECT o.*, c.first_name, c.last_name, a.street, a.city, a.province, a.zip_code
      FROM orders o
      JOIN customer c ON o.customer_id = c.customer_id
      JOIN addresses a ON o.address_num = a.address_num
      ORDER BY o.order_date DESC
    `;
    const [rows] = await this.pool().query(sql);
    return rows;
  }

  async getAllOrderItems() {
    const sql = `
      SELECT oi.*, p.product_name
      FROM orderItems oi
      LEFT JOIN products p ON oi.product_id = p.product_id
      ORDER BY oi.order_item_id DESC
    `;
    const [rows] = await this.pool().query(sql);
    return rows;
  }

  async getMyOrderItems(customer_id: number) {
    const sql = `
      SELECT oi.*, p.product_name
      FROM orderItems oi
      JOIN orders o ON oi.order_id = o.order_id
      LEFT JOIN products p ON oi.product_id = p.product_id
      WHERE o.customer_id = ?
      ORDER BY oi.order_item_id DESC
    `;
    const [rows] = await this.pool().execute<RowDataPacket[]>(sql, [customer_id]);
    return rows;
  }

  async deleteOrderItem(order_item_id: number) {
    const [res] = await this.pool().execute<OkPacket>(
      'DELETE FROM orderItems WHERE order_item_id = ?',
      [order_item_id],
    );
    return res.affectedRows > 0;
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

  async createOrder(
    customer_id: number,
    address_num: number,
    total_price: number,
    order_status?: string,
  ) {
    const [result] = await this.pool().execute<OkPacket>(
      'INSERT INTO orders (customer_id, address_num, total_price, order_status) VALUES (?, ?, ?, ?)',
      [customer_id, address_num, total_price, order_status || 'Pending'],
    );
    return this.findById(result.insertId);
  }

  /**
   * Full Atomic Checkout Transaction:
   * 1. Resolves or creates `addresses` row (`address_num`)
   * 2. Creates `orders` row (`order_id`)
   * 3. Inserts each line item into `orderItems` & deducts `products.stock_qty`
   * 4. Creates 1-to-1 `payments` record
   */
  async createFullOrder(dto: CreateFullOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item.');
    }

    const connection = await this.pool().getConnection();

    try {
      await connection.beginTransaction();

      // 1. Resolve `address_num` (use existing saved address OR insert new into `addresses`)
      let finalAddressNum = dto.address_num;
      if (!finalAddressNum) {
        if (!dto.street || !dto.city || !dto.province || !dto.zip_code) {
          throw new BadRequestException(
            'Street, city, province, and zip_code are required for a new delivery address.',
          );
        }

        const [addrResult] = await connection.execute<ResultSetHeader>(
          'INSERT INTO addresses (customer_id, street, city, province, zip_code) VALUES (?, ?, ?, ?, ?)',
          [dto.customer_id, dto.street, dto.city, dto.province, dto.zip_code],
        );
        finalAddressNum = addrResult.insertId;
      }

      // 2. Insert into `orders`
      const [orderResult] = await connection.execute<ResultSetHeader>(
        'INSERT INTO orders (customer_id, address_num, total_price, order_status) VALUES (?, ?, ?, ?)',
        [dto.customer_id, finalAddressNum, dto.total_price, dto.order_status || 'Pending'],
      );
      const orderId = orderResult.insertId;

      // 3. Insert into `orderItems` (exact camelCase) & deduct stock safely
      for (const item of dto.items) {
        const [stockRes] = await connection.execute<ResultSetHeader>(
          'UPDATE products SET stock_qty = stock_qty - ? WHERE product_id = ? AND stock_qty >= ?',
          [item.quantity, item.product_id, item.quantity],
        );

        if (stockRes.affectedRows === 0) {
          throw new BadRequestException(
            `Insufficient stock for product ID #${item.product_id}.`,
          );
        }

        await connection.execute<ResultSetHeader>(
          'INSERT INTO orderItems (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
          [orderId, item.product_id, item.quantity, item.price_at_purchase],
        );
      }

      // 4. Insert 1-to-1 payment record into `payments`
      await connection.execute<ResultSetHeader>(
        'INSERT INTO payments (order_id, payment_method, payment_status, amount_paid) VALUES (?, ?, ?, ?)',
        [
          orderId,
          dto.payment_method || 'Cash on Delivery',
          dto.payment_status || 'Pending',
          dto.amount_paid ?? dto.total_price,
        ],
      );

      await connection.commit();
      return this.findById(orderId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateOrder(order_id: number, order_status: string) {
    await this.pool().execute('UPDATE orders SET order_status = ? WHERE order_id = ?', [
      order_status,
      order_id,
    ]);
    return this.findById(order_id);
  }

  async deleteOrder(order_id: number) {
    const [res] = await this.pool().execute<OkPacket>(
      'DELETE FROM orders WHERE order_id = ?',
      [order_id],
    );
    return res.affectedRows > 0;
  }
}