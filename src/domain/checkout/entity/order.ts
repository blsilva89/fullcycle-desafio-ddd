import OrderItem from "./order_item";
export default class Order {
  private _id: string;
  private _customerId: string;
  private _items: OrderItem[];
  private _total: number;

  constructor(id: string, customerId: string, items: OrderItem[]) {
    this._id = id;
    this._customerId = customerId;
    this._items = items;
    this._total = this.total();
    this.validate();
  }

  get id(): string {
    return this._id;
  }

  get customerId(): string {
    return this._customerId;
  }

  get items(): OrderItem[] {
    return this._items;
  }

  validate(): boolean {
    if (this._id.length === 0) {
      throw new Error("Id is required");
    }
    if (this._customerId.length === 0) {
      throw new Error("CustomerId is required");
    }
    if (this._items.length === 0) {
      throw new Error("Items are required");
    }

    if (this._items.some((item) => item.quantity <= 0)) {
      throw new Error("Quantity must be greater than 0");
    }

    return true;
  }

  total(): number {
    return this._items.reduce((acc, item) => acc + item.total(), 0);
  }

  addItem(item: OrderItem): void {
    const order_item = this._items.find(addedItem => addedItem.id === item.id);
    if (order_item !== undefined) throw new Error("Item is already in the order");

    this._items.push(item)
  }

  removeItem(itemToRemove: OrderItem): void {
    const order_item = this._items.find(item => item.id === itemToRemove.id);
    if (order_item === undefined) throw new Error("Item not found");

    this._items = this._items.filter(item => item.id !== itemToRemove.id)
  }

  increaseItemQuantity(itemId: string, quantity: number): void {
    const order_item = this._items.find(item => item.id === itemId);
    if (order_item === undefined) throw new Error("Item not found");

    order_item.increaseItemQuantity(quantity);
  }

  decreaseItemQuantity(itemId: string, quantity: number): void {
    const order_item = this._items.find(item => item.id === itemId);
    if (order_item === undefined) throw new Error("Item not found");

    order_item.decreaseItemQuantity(quantity);
  }
}
