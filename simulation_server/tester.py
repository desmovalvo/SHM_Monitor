#!/usr/bin/python3

# global reqs
import json
import time
import requests
import threading
import websocket
from termcolor import colored

# the Thread
class FuncThread(threading.Thread):

    def __init__(self, target, args, q):
        self._target = target
        self._args = args
        self.queue = q
        self.testConf = json.loads(args)
        threading.Thread.__init__(self)
 
    def run(self):
        print(colored("TestThread> ", "blue", attrs=["bold"]) + " Starting test" + self.testConf["name"] + "'")
        print(colored("TestThread> ", "blue", attrs=["bold"]) + " Received configuration: ")
        for k in self.testConf.keys():
            print(" - %s: %s" % (k, self.testConf[k]))
        
        # initialize results
        testResults = {}
        for server in self.testConf["servers"]:
            testResults[server] = []

        # test!
        for server in self.testConf["servers"]:

            for iteration in range(self.testConf["test"]["iterations"]):

                # debug print
                print(colored("TestThread> ", "blue", attrs=["bold"]) + " Testing server '%s'" % server)

                class Tester:

                    def __init__(self, test, q):
                        print(colored("TesterWS> ", "blue", attrs=["bold"]) + " Initializing TesterWS class")
                        self.testConf = test
                        self.startTime = None
                        self.endTime = None
                        self.queue = q
                        
                    # open a ws, subscribe, and perform the update
                    def on_open(self, ws):
                        
                        # debug print
                        print(colored("TesterWS> ", "blue", attrs=["bold"]) + " Subscribing...")
                        
                        # send the subscription request
                        print(self.testConf["test"]["update"])
                        ws.send(json.dumps({"subscribe":self.testConf["test"]["activeSubscription"], "alias":"foo"}))
                    
                    def on_message(self, ws, message):
    
                        # parse the message
                        jmessage = json.loads(message)
                        
                        # if it is a confirm message
                        if "spuid" in jmessage:

                            # debug print
                            print(colored("TesterWS> ", "blue", attrs=["bold"]) + " Sending the Update")                            

                            # start the counter
                            self.startTime = time.time()
                                
                            # do the update
                            headers = {"Content-Type":"application/sparql-update", 
                                       "Accept":"application/json"}                                   
                            r = requests.post(self.testConf["servers"][server]["updateURI"],
                                              headers = headers,
                                              data = self.testConf["test"]["update"],
                                              verify = False)        
                            r.connection.close()
                                            
                        # if it is a notification
                        if "results" in jmessage:
    
                            # stop the timer
                            self.endTime = time.time()
                            #self.queue.put(self.endTime - self.startTime)
                        
                            # close the websocket
                            ws.close()
                        
                    def on_error(self, ws, error):
                        print(error)
                    
                    def on_close(self, ws):
                        print("Closing websocket")                        

                c = Tester(self.testConf, self.queue)                                    
                ws = websocket.WebSocketApp(self.testConf["servers"][server]["subscribeURI"],
                                            on_message = c.on_message,
                                            on_error = c.on_error,
                                            on_close = c.on_close)
                ws.on_open = c.on_open
                ws.run_forever()
                testResults[server].append(c.endTime - c.startTime)
                
        self.queue.put(testResults)        
        print("Returning")
        return testResults
