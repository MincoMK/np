export class RouteTable {
  private table: Map<string, string> = new Map();

  public assign(addr: string, via: string) {
    this.table.set(addr, via);
  }

  public resolve(addr: string) {
    return this.table.get(addr);
  }

  public get() {
    return this.table;
  }
}
