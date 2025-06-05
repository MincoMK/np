export class IdTable {
  private table: Map<string, number> = new Map();

  public constructor(private address: string) {
    rednet.host("ngp.id", address);
  }

  public assign(addr: string, id: number) {
    this.table.set(addr, id);
  }

  public lookupCache(addr: string): number | undefined {
    return this.table.get(addr);
  }

  public lookupNet(addr: string): number | undefined {
    const n = [rednet.lookup("ngp.id", addr)].filter(
      (x) => x == 0 || x,
    ) as number[];
    return n.length == 0 ? undefined : n[0];
  }

  public reverseLookupCache(id: number): string | undefined {
    for (const [address, searchId] of this.table.entries()) {
      if (searchId == id) return address;
    }
  }

  public reverseLookupNet(id: number): string | undefined {
    rednet.send(id, 0, "ngp.rlookup");
    try {
      const [_, data] = rednet.receive("ngp.rlookup." + id, 1);
      return data.address;
    } catch (e) {}
  }

  public reverseResolve(id: number): string | undefined {
    const c = this.reverseLookupCache(id);
    if (c) return c;
    const n = this.reverseLookupNet(id);
    if (n) this.assign(n, id);
    return n;
  }

  public resolve(addr: string): number | undefined {
    const c = this.lookupCache(addr);
    if (c) return c;
    const n = this.lookupNet(addr);
    if (n) this.assign(addr, n);
    return n;
  }

  public flush(): void {
    this.table.clear();
  }

  public getAddress(): string {
    return this.address;
  }

  public listen() {
    while (true) {
      try {
        const [id, _] = rednet.receive("ngp.rlookup");
        rednet.send(
          id,
          { address: this.address },
          "ngp.rlookup." + os.getComputerID(),
        );
      } catch (err) {
        print(err);
      }
    }
  }
}
