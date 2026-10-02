---
agentTools:
  projectIndex: https://fintava.readme.io/llms.txt
---

# Verifying Events

Verifying webhook events come from Fintava is necessary to avoid creating transactions due to a fraudulent event.  To verify events, validate the x-fintava-signature header sent with the event

> **Important Security Notes:**
>
> * Always verify the `x-fintava-signature` header before processing webhooks
> * Use your webhook secret from the Fintava dashboard
> * Never hardcode secrets - use environment variables
> * Use raw request body for signature verification (not parsed JSON)

Node.js

```javascript
const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json({ verify: (req, res, buf) => {
  req.rawBody = buf;
}}));

app.post("/webhook_url", function(req, res) {  
  const webhookSecret = process.env.WEBHOOK_SECRET;
  
  // Validate signature
  const hash = crypto
    .createHmac('sha512', webhookSecret)
    .update(req.rawBody)  // Use raw body for exact match
    .digest('hex');
  
  if (hash === req.headers['x-fintava-signature']) {  
    const event = req.body;
    console.log('Webhook received:', event);
    
    // Process the event
    switch (event.type) {
      case 'wallet_to_wallet_transfer_v2':
        handleWalletToWallet(event.data);
        break;
      case 'account_funded':
        handleAccountFunded(event.data);
        break;
    }
    
    return res.status(200).json({ received: true });
  } else {
    console.error('Invalid signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }
});
```

Python

```python
from flask import Flask, request, jsonify
import hashlib
import hmac
import os

app = Flask(__name__)

@app.route('/webhook_url', methods=['POST'])
def webhook():
    webhook_secret = os.environ.get('WEBHOOK_SECRET').encode()
    signature = request.headers.get('x-fintava-signature')
    
    # Generate expected signature
    expected_signature = hmac.new(
        webhook_secret, 
        request.get_data(), 
        hashlib.sha512
    ).hexdigest()
    
    # Compare signatures securely
    if hmac.compare_digest(expected_signature, signature):
        event = request.json
        print(f"Webhook received: {event}")
        
        # Process event here
        return jsonify({'status': 'success'}), 200
    else:
        return jsonify({'error': 'Invalid signature'}), 401
```

PHP

```php
<?php
$webhook_secret = getenv('WEBHOOK_SECRET');
$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_FINTAVA_SIGNATURE'];

// Calculate expected signature
$expected_signature = hash_hmac('sha512', $payload, $webhook_secret);

// Compare signatures (timing-safe)
if (hash_equals($expected_signature, $signature)) {
    $event = json_decode($payload, true);
    
    // Process the event
    error_log("Webhook received: " . print_r($event, true));
    
    http_response_code(200);
    echo json_encode(['status' => 'success']);
} else {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid signature']);
}
?>
```