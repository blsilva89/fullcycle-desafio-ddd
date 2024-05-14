
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository {
  /**
   *
   */
  constructor(private sequelize: any) { }

  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async find(id: string): Promise<Order> {
    const orderModel = await OrderModel.findByPk(id, {
      include: [OrderItemModel]
    });

    if (!orderModel) throw new Error("Order not found");

    const items: OrderItem[] = orderModel.items.map(item => (
      new OrderItem(
        item.id,
        item.name,
        item.price,
        item.product_id,
        item.quantity)
    ));

    const order = new Order(orderModel.id, orderModel.customer_id, items);
    return order;
  }

  async findAll(): Promise<Order[]> {
    const orderModels = await OrderModel.findAll({
      include: [OrderItemModel]
    });

    if (!orderModels.length) return [];

    const orders: Order[] = orderModels.map(orderModel => {
      const items: OrderItem[] = orderModel.items.map(item => (
        new OrderItem(
          item.id,
          item.name,
          item.price,
          item.product_id,
          item.quantity)
      ));
      return new Order(orderModel.id, orderModel.customer_id, items);
    });

    return orders;
  }

  async update(entity: Order): Promise<void> {
    const transaction = await this.sequelize.transaction();

    try {
      const orderModel = await OrderModel.findByPk(entity.id, {
        include: [OrderItemModel]
      });

      if (!orderModel) throw new Error("Order not found");

      orderModel.customer_id = entity.customerId;
      orderModel.total = entity.total();
      await orderModel.save({ transaction: transaction });

      for (const item of orderModel.items) {
        const entityItem = entity.items.find(entityItem => entityItem.id === item.id);

        if (entityItem) {
          item.name = entityItem.name;
          item.price = entityItem.price;
          item.product_id = entityItem.productId;
          item.quantity = entityItem.quantity;

          await item.save({ transaction: transaction });
        } else {
          await item.destroy({ transaction: transaction });
        }
      }

      const newItems = entity.items.filter(entityItem => !orderModel.items.some(item => item.id === entityItem.id));
      await OrderItemModel.bulkCreate(newItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        product_id: item.productId,
        order_id: entity.id,
        quantity: item.quantity
      })), { transaction: transaction });

      await transaction.commit();
    } catch (error: any) {
      await transaction.rollback();
      throw new Error(`Error while trying to update order`);
    }
  }
}
