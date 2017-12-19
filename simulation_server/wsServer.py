#!/usr/bin/python3

# global reqs
import queue
import threading
import tornado.web
import tornado.ioloop
import tornado.websocket
from termcolor import colored
from tornado.options import define, options, parse_command_line

# local reqs
from tester import *
  
define("port", default=8888, help="run on the given port", type=int)

# handler class
class WebSocketHandler(tornado.websocket.WebSocketHandler):

    def check_origin(self, origin):
        return True
    
    def open(self, *args):
        print(colored("WSHandler> ", "blue", attrs=["bold"]) + "Opening WebSocket for test requests")
        pass

    def on_message(self, message):        

        # debug
        print(colored("WSHandler> ", "blue", attrs=["bold"]) + "Received a test request")
        
        # create a Queue to exchange messages with the thread
        q = queue.Queue(maxsize=0)

        # start and join the thread
        t1 = FuncThread("someOtherFunc", message, q)
        t1.start()
        t1.join()

        # test completed
        print(colored("WSHandler> ", "blue", attrs=["bold"]) + "Test completed")
        self.write_message(q.get())
        return
        
    def on_close(self):
        print(colored("WSHandler> ", "blue", attrs=["bold"]) + "Closing WS")
        
        
# bind the handler to the app
app = tornado.web.Application([
    (r'/tst', WebSocketHandler),
])

# main
if __name__ == '__main__':
    parse_command_line()
    app.listen(options.port)
    print(colored("wsServer> ", "blue", attrs=["bold"]) + "Starting WS server")
    tornado.ioloop.IOLoop.instance().start()
