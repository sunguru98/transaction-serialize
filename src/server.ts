import express, { ErrorRequestHandler } from 'express';
import { config } from 'dotenv';
import { Keypair, Transaction } from '@solana/web3.js';
import { IpDeniedError, IpFilter } from 'express-ipfilter';

const app = express();
const PORT = 4000;

config();

// Allow the following IPs
const ips = ['192.168.0.110'];

// Create the server
app.use(
  IpFilter(ips, {
    mode: 'allow',
    log: true,
  })
);

// Allow JSON body
app.use(express.json());

app.post('/sign', (req, res) => {
  try {
    if (!req.body.txData) {
      return res.status(400).json({ error: 'TX Data missing' });
    }

    if (!process.env.AUTHORITY_KEYPAIR) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const tx = Transaction.from(req.body.txData.data);
    tx.partialSign(
      Keypair.fromSecretKey(
        Uint8Array.from(JSON.parse(process.env.AUTHORITY_KEYPAIR))
      )
    );
    return res.send({ txData: tx.serialize({ requireAllSignatures: false }) });
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

const errorHandler: ErrorRequestHandler = (err, _, res, _next) => {
  res.status(err instanceof IpDeniedError ? 403 : err.status || 500);
  res.json({
    error: 'Unauthorized IP Address',
  });
};

app.use(errorHandler);

app.listen(PORT, () => console.log('App listening on port:', PORT));
