import Order from "./order";
import OrderItem from "./order_item";

describe("Order unit tests", () => {
  it("should throw error when id is empty", () => {
    expect(() => {
      let order = new Order("", "123", []);
    }).toThrowError("Id is required");
  });

  it("should throw error when customerId is empty", () => {
    expect(() => {
      let order = new Order("123", "", []);
    }).toThrowError("CustomerId is required");
  });

  it("should throw error when items is empty", () => {
    expect(() => {
      let order = new Order("123", "123", []);
    }).toThrowError("Items are required");
  });

  it("should calculate total", () => {
    const item = new OrderItem("i1", "Item 1", 100, "p1", 2);
    const item2 = new OrderItem("i2", "Item 2", 200, "p2", 2);
    const order = new Order("o1", "c1", [item]);

    let total = order.total();

    expect(order.total()).toBe(200);

    const order2 = new Order("o1", "c1", [item, item2]);
    total = order2.total();
    expect(total).toBe(600);
  });

  it("should increase the quantity of an item", () => {
    const item = new OrderItem("i1", "Item 1", 100, "p1", 2);
    const order = new Order("o1", "c1", [item]);

    expect(order.total()).toBe(200);

    order.increaseItemQuantity("i1", 1)

    expect(order.total()).toBe(300);
  });

  it("should decrease the quantity of an item", () => {
    const item = new OrderItem("i1", "Item 1", 100, "p1", 2);
    const order = new Order("o1", "c1", [item]);

    expect(order.total()).toBe(200);

    order.decreaseItemQuantity("i1", 1)

    expect(order.total()).toBe(100);
  });

  it("should add item to the order", () => {
    const item = new OrderItem("i1", "Item 1", 100, "p1", 2);
    const item2 = new OrderItem("i2", "Item 2", 200, "p2", 2);
    const order = new Order("o1", "c1", [item]);

    expect(order.items.length).toBe(1);

    order.addItem(item2)

    expect(order.items.length).toBe(2);
    expect(order.total()).toBe(600);
  });

  it("should remove item in the order", () => {
    const item = new OrderItem("i1", "Item 1", 100, "p1", 2);
    const order = new Order("o1", "c1", [item]);

    expect(order.items.length).toBe(1);

    order.removeItem(item);

    expect(order.items.length).toBe(0);
    expect(order.total()).toBe(0);
  });

  it("should throw error if the item qte is less or equal zero 0", () => {
    expect(() => {
      const item = new OrderItem("i1", "Item 1", 100, "p1", 0);
      const order = new Order("o1", "c1", [item]);
    }).toThrowError("Quantity must be greater than 0");
  });

  it("should throw an error when trying to remove an item not added in the order", () => {
    expect(() => {
      const item = new OrderItem("i1", "Item 1", 100, "p1", 1);
      const order = new Order("o1", "c1", [item]);
      const nonexistentItemOrder = new OrderItem("i2", "Item 1", 100, "p1", 1);
      order.removeItem(nonexistentItemOrder);
    }).toThrowError("Item not found");
  });

  it("should throw an error when trying to increase the quantity for an item not added in the order", () => {
    expect(() => {
      const item = new OrderItem("i1", "Item 1", 100, "p1", 1);
      const order = new Order("o1", "c1", [item]);
      order.increaseItemQuantity("i2", 10);
    }).toThrowError("Item not found");
  });

  it("should throw an error when trying to decrease the quantity for an item not added in the order", () => {
    expect(() => {
      const item = new OrderItem("i1", "Item 1", 100, "p1", 1);
      const order = new Order("o1", "c1", [item]);
      order.decreaseItemQuantity("i2", 10);
    }).toThrowError("Item not found");
  });

  it("should throw an error when trying to add the same item to the order", () => {
    expect(() => {
      const item = new OrderItem("i1", "Item 1", 100, "p1", 1);
      const order = new Order("o1", "c1", [item]);
      order.addItem(item);
    }).toThrowError("Item is already in the order");
  });
});
