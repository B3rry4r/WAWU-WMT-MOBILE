---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Introduction

Using Fintava webhooks

> 📘 What are Webhooks?
>
> Webhooks are set up to automatically to receive updates from Fintava when an API request has been made.

Typically, when you send an API request, you expect a response immediately. You'll get a timeout error response if the response takes too long. To prevent this, a pending response is returned. However, you need to update your records with the final state of your API request. The best way to do this is with a webhook that will listen for it, and automatically send you the final response.

### How to create a Webhook URL

A webhook URL is simply a POST endpoint that a resource server sends updates to.

```Text node
/ Using Express
app.post("/my/webhook/url", function(req, res) {
    // Retrieve the request's body
    const event = req.body;
    // Do something with event
    res.send(200);
});
```

Your webhook URL needs to acknowledge an event when an event is sent to it. You know it acknowledges an event when it returns a 200 OK in the response header. If you don't get this response code, we'll keep sending events for the next 72 hours.

* In live mode, we’ll send webhooks every 3 minutes for the first 4 tries, then we switch to sending hourly for the next 72 hours
* In test mode, we send webhooks hourly for the next 72 hours

> 🚧 Avoid long-running tasks
>
> If you have long-running tasks in your webhook function, you should acknowledge the event before executing the long-running tasks. Long-running tasks will lead to a request timeout and an automatic error response from your server. Without a 200 OK response, we retry as described in the paragraph above.

### Using your webhook URL

It is time to start using your webhook URL. Do everything in this checklist to get started.

* [x] Add the webhook URL on your Fintava Merchant dashboard
* [x] Ensure your webhook URL is publicly available (localhost URLs cannot receive events)
* [x] If using .htaccess kindly remember to add the trailing / to the URL
* [x] Test your webhook to ensure you’re getting the JSON body and returning a 200 OK HTTP response
* [x] If your webhook function has long-running tasks, you should first acknowledge receiving the webhook by returning a 200 OK before proceeding with the long-running tasks
* [x] If we don’t get a 200 OK HTTP response from your webhooks, we flagged it as a failed attempt
* [x] In the live mode, failed attempts are retried every 3 minutes for the first 4 tries, then we switch to sending hourly for the next 72 hours
* [x] In the test mode, failed attempts are retried hourly for the next 72 hours

### Webhook Events