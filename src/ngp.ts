import { IdTable } from "./id-table";
import { IdNet } from "./net";
import { RouteTable } from "./route-table";

export class NGP {
  private peers: string[] = [];

  public constructor(
    private idTable: IdTable,
    private routingTable: RouteTable,
    private net: IdNet,
  ) {}

  public addPeer(peerAddr: string) {
    this.peers.push(peerAddr);
  }

  private announceSelfTo(peer: string) {
    const address = this.idTable.getAddress();
    this.announceViaTo(peer, address, address);
  }

  private announceAllViaTo(peer: string) {
    this.routingTable.get().forEach((address, via) => {
      this.announceViaTo(peer, address, via);
    });
  }

  private announceViaTo(peerAddr: string, address: string, via: string) {
    this.net.send(peerAddr, "ngp.announce", {
      address,
      via,
    });
  }

  private announceOnlineTo(peer: string) {
    this.net.send(peer, "ngp.online", 0);
    this.announceSelfTo(peer);
    this.announceAllViaTo(peer);
  }

  public announceOnline() {
    for (const peer of this.peers) {
      try {
        this.announceOnlineTo(peer);
      } catch (e) {
        print("Peer " + peer + " offline.");
      }
    }
  }

  private listenOnline() {
    while (true) {
      try {
        const { address } = this.net.receive("ngp.online");
        if (this.peers.includes(address)) {
          this.announceSelfTo(address);
          this.announceAllViaTo(address);
          print("Peer " + address + " online.");
        } else {
          print(`Unknown peer announced online: ${address}`);
        }
      } catch (e) {
        print(e);
      }
    }
  }

  private listenAnnounce() {
    while (true) {
      try {
        const { address, data } = this.net.receive("ngp.announce");

        if (this.peers.includes(address)) {
          print(`Peer ${address} announced network.`);

          this.routingTable.assign(data.address, data.via);

          for (const peer of this.peers.filter((p) => p != address)) {
            try {
              this.announceViaTo(peer, data.address, data.via);
            } catch (e) {
              print(e);
            }
          }
        } else {
          print(`Unknown peer ${address} tried to announce.`);
        }
      } catch (e) {
        print(e);
      }
    }
  }

  public listen() {
    parallel.waitForAll(
      () => this.listenOnline(),
      () => this.listenAnnounce(),
    );
  }
}
