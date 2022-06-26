import express from 'express';
import { config } from 'dotenv';
import { Keypair, Transaction } from '@solana/web3.js';

const app = express();
const PORT = 4000;

config();

// Allow JSON body
app.use(express.json());

app.get('/', (_, res) => {
  res.status(203).json({ ping: 'pong' });
});

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

app.listen(PORT, () => console.log('App listening on port:', PORT));
