#!/usr/bin/env python3

from socket import socket, AF_INET, SOCK_STREAM, IPPROTO_TCP, TCP_NODELAY
from socketserver import TCPServer, ThreadingMixIn, StreamRequestHandler


class ServerHandler(StreamRequestHandler):
    def handle(self):
        print("connected %s:%d" % self.client_address)
        gpsd = socket(AF_INET, SOCK_STREAM)
        gpsd.setsockopt(IPPROTO_TCP, TCP_NODELAY, True)
        gpsd.connect(("127.0.0.1", 2947))
        with gpsd.makefile("brw", 0) as upstream:
            upstream.readline()  # consume VERSION report
            upstream.write("?WATCH={\"enable\":true,\"nmea\":true}".encode())
            upstream.readline()  # consume DEVICES report
            upstream.readline()  # consume WATCH report
            while True:
                try:
                    self.wfile.write(upstream.readline())
                except BrokenPipeError:
                    break
        gpsd.close()
        print("disconnected %s:%d" % self.client_address)


class ThreadedTCPServer(ThreadingMixIn, TCPServer):
    pass


def main():
    try:
        with ThreadedTCPServer(("0.0.0.0", 10110), ServerHandler) as server:
            server.serve_forever()
    except KeyboardInterrupt:
        print()


if __name__ == "__main__":
    main()
