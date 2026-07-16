jest.mock('../src/models', () => {
  const Wallet = {
    findOne: jest.fn(),
    create: jest.fn(),
  };
  const Transaction = {
    create: jest.fn(),
  };
  const sequelize = {
    transaction: jest.fn(async (cb) => cb({ LOCK: { UPDATE: Symbol('UPDATE') } })),
    models: { Wallet, Transaction },
  };
  return { sequelize };
});

const { creditWallet, debitWallet, transfer } = require('../src/services/walletService');
const { sequelize } = require('../src/models');

describe('Wallet service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creditWallet creates wallet if none exists and records transaction', async () => {
    const Wallet = sequelize.models.Wallet;
    const Transaction = sequelize.models.Transaction;

    const fakeWallet = { id: 'w1', userId: 'u1', balance: '0.00', save: jest.fn(), reload: jest.fn() };

    Wallet.findOne.mockResolvedValue(null);
    Wallet.create.mockResolvedValue(fakeWallet);
    Transaction.create.mockResolvedValue({});

    const result = await creditWallet('u1', 100.0, { reason: 'topup' });

    expect(Wallet.findOne).toHaveBeenCalledWith({ where: { userId: 'u1' }, transaction: expect.any(Object), lock: undefined });
    expect(Wallet.create).toHaveBeenCalledWith({ userId: 'u1' }, { transaction: expect.any(Object) });
    expect(fakeWallet.save).toHaveBeenCalledWith({ transaction: expect.any(Object) });
    expect(Transaction.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'credit', amount: 100.0 }), { transaction: expect.any(Object) });
    expect(result).toBe(fakeWallet);
  });

  test('debitWallet throws when insufficient funds', async () => {
    const Wallet = sequelize.models.Wallet;
    const fakeWallet = { id: 'w2', userId: 'u2', balance: '5.00', save: jest.fn(), reload: jest.fn() };

    Wallet.findOne.mockResolvedValue(fakeWallet);

    await expect(debitWallet('u2', 10.0)).rejects.toMatchObject({ message: 'Insufficient funds' });

    expect(Wallet.findOne).toHaveBeenCalled();
  });

  test('transfer throws when from wallet has insufficient funds', async () => {
    const Wallet = sequelize.models.Wallet;
    const fromWallet = { id: 'w3', userId: 'u3', balance: '3.00', save: jest.fn(), reload: jest.fn() };
    const toWallet = { id: 'w4', userId: 'u4', balance: '0.00', save: jest.fn(), reload: jest.fn() };

    // getOrCreateWallet will call findOne first; we return wallets in sequence
    Wallet.findOne
      .mockResolvedValueOnce(fromWallet) // for from
      .mockResolvedValueOnce(toWallet); // for to

    await expect(transfer('u3', 'u4', 10.0)).rejects.toMatchObject({ message: 'Insufficient funds for transfer' });
    expect(Wallet.findOne).toHaveBeenCalled();
  });
});
