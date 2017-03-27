// Copyright 2015-2017 Parity Technologies (UK) Ltd.
// This file is part of Parity.

// Parity is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Parity is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Parity.  If not, see <http://www.gnu.org/licenses/>.

import Account from './account';

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const LOCAL_STORAGE_KEY = '_parity::localAccounts';

function fromLocalStorage () {
  const json = window.localStorage.getItem(LOCAL_STORAGE_KEY);

  if (json == null) {
    return {};
  }

  return JSON.parse(json);
}

function toLocalStorage (data) {
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

export default class Accounts {
  constructor (data = fromLocalStorage()) {
    const {
      last = NULL_ADDRESS,
      store = []
    } = data;

    this._persistTimer = null;
    this._last = last;
    this._store = store.map((data) => new Account(this.persist, data));
  }

  create (secret, password) {
    const privateKey = Buffer.from(secret.slice(2), 'hex');
    const account = Account.fromPrivateKey(this.persist, privateKey, password);

    this._store.push(account);
    this._last = account.address;

    this.persist();

    return account.address;
  }

  lastUsed () {
    return this._last;
  }

  get (address) {
    address = address.toLowerCase();

    this._last = address;

    const account = this._store.find((account) => account.address === address);

    if (account == null) {
      throw new Error(`Account not found: ${address}`);
    }

    return account;
  }

  remove (address) {
    address = address.toLowerCase();

    const index = this._store.findIndex((account) => account.address === address);

    if (index === -1) {
      return false;
    }

    if (address === this._last) {
      this._last = NULL_ADDRESS;
    }

    this._store.splice(index, 1);

    this.persist();

    return true;
  }

  mapArray (mapper) {
    return this._store.map(mapper);
  }

  mapObject (mapper) {
    const result = {};

    this._store.forEach((account) => {
      result[account.address] = mapper(account);
    });

    return result;
  }

  toJSON () {
    return {
      last: this._last,
      store: this._store
    };
  }

  persist = () => {
    clearTimeout(this._persistTimer);

    // Throttle persisting the accounts
    this._persistTimer = setTimeout(() => {
      toLocalStorage(this);
    }, 100);
  }
}
