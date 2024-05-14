import { Sequelize } from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";

describe("Order repository test", () => {
  let sequelize: Sequelize;
  let customer: Customer;
  let product: Product;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();

    const customerRepository = new CustomerRepository();
    customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    product = new Product("1", "Product 1", 10);
    await productRepository.create(product);
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should create a new order", async () => {
    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      "1",
      2
    );

    const order = new Order("123", "123", [orderItem]);
    const orderRepository = new OrderRepository(sequelize);
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "1",
        },
      ],
    });
  });

  it("should get order by id", async () => {
    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      "1",
      2
    );

    const order = new Order("123", "123", [orderItem]);
    const orderRepository = new OrderRepository(sequelize);

    await orderRepository.create(order);

    const createdOrder = await orderRepository.find(order.id);

    expect(order).toStrictEqual<Order>(createdOrder);
  });

  it("should update order adding a item", async () => {
    const orderItem = new OrderItem("i1", product.name, product.price, product.id, 5);
    const newItem = new OrderItem("i2", product.name, product.price, product.id, 10);

    const order = new Order("123", "123", [orderItem]);

    const orderRepository = new OrderRepository(sequelize);
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: orderItem.productId,
        },
      ],
    });


    order.addItem(newItem);

    await orderRepository.update(order);

    const updatedModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(updatedModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "1",
        },
        {
          id: newItem.id,
          name: newItem.name,
          price: newItem.price,
          quantity: newItem.quantity,
          order_id: "123",
          product_id: newItem.productId,
        },
      ],
    });
  });

  it("should update order removing an item", async () => {
    const orderItem = new OrderItem("i1", product.name, product.price, product.id, 5);
    const newItem = new OrderItem("i2", product.name, product.price, product.id, 10);

    const order = new Order("123", "123", [orderItem, newItem]);

    const orderRepository = new OrderRepository(sequelize);
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "1",
        },
        {
          id: newItem.id,
          name: newItem.name,
          price: newItem.price,
          quantity: newItem.quantity,
          order_id: "123",
          product_id: newItem.productId,
        },
      ],
    });

    order.removeItem(orderItem);
    await orderRepository.update(order);

    const updatedModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(updatedModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: newItem.id,
          name: newItem.name,
          price: newItem.price,
          quantity: newItem.quantity,
          order_id: "123",
          product_id: newItem.productId,
        },
      ],
    });
  });

  it("should rollback order to previous state when the update transaction fails", async () => {
    const orderItem = new OrderItem("i1", product.name, product.price, product.id, 5);
    const invalidItem = new OrderItem("i2", product.name, product.price, "invalid id", 10);

    const order = new Order("123", "123", [orderItem]);

    const orderRepository = new OrderRepository(sequelize);
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "1",
        }
      ],
    });

    try {
      order.addItem(invalidItem);
      await orderRepository.update(order);
    } catch (error: any) {
      expect(error.message).toEqual("Error while trying to update order");

      const updatedModel = await OrderModel.findOne({
        where: { id: order.id },
        include: ["items"],
      });

      expect(updatedModel.toJSON()).toStrictEqual({
        id: "123",
        customer_id: "123",
        total: product.price * orderItem.quantity,
        items: [
          {
            id: orderItem.id,
            name: orderItem.name,
            price: orderItem.price,
            quantity: orderItem.quantity,
            order_id: "123",
            product_id: orderItem.productId,
          },
        ],
      });
    }
  });

  it("Should find all orders", async () => {
    const firstOrderItem = new OrderItem("i1", product.name, product.price, product.id, 5);
    const secondOrderItem = new OrderItem("i2", product.name, product.price, product.id, 5);
    const orders = [
      new Order("123", "123", [firstOrderItem]),
      new Order("321", "123", [secondOrderItem]),
    ];

    const orderRepository = new OrderRepository(sequelize);
    await orderRepository.create(orders[0]);
    await orderRepository.create(orders[1]);

    let retrievedOrders = await orderRepository.findAll();

    expect(retrievedOrders).toStrictEqual(orders);

    const thirdOrderItem = new OrderItem("i3", product.name, product.price, product.id, 5);
    orders.push(new Order("456", "123", [thirdOrderItem]));
    await orderRepository.create(orders[2]);

    retrievedOrders = await orderRepository.findAll();
    expect(retrievedOrders).toStrictEqual(orders);
  });
});
