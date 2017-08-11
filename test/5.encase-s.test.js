import {expect} from 'chai';
import {Future, encaseS, tryS} from '../index.es.js';
import * as U from './util';
import type from 'sanctuary-type-identifiers';
import through from 'through2';

const unaryNoop = a => Promise.resolve(a);

describe('encaseS()', () => {

  it('is a curried binary function', () => {
    expect(encaseS).to.be.a('function');
    expect(encaseS.length).to.equal(2);
    expect(encaseS(U.noop)).to.be.a('function');
  });

  it('throws TypeError when not given a function', () => {
    const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
    const fs = xs.map(x => () => encaseS(x));
    fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
  });

  it('returns an instance of Future', () => {
    expect(encaseS(unaryNoop, null)).to.be.an.instanceof(Future);
  });

});

describe.only('EncaseS', () => {

  it('extends Future', () => {
    expect(encaseS(U.noop, 1)).to.be.an.instanceof(Future);
  });

  it('is considered a member of fluture/Fluture', () => {
    expect(type(tryS(U.noop, 1))).to.equal(Future['@@type']);
  });

  describe('#fork()', () => {

    describe('(nullary)', () => {

      it('throws TypeError when the function does not return a Stream', () => {
        const f = () => tryS(U.noop).fork(U.noop, U.noop);
        expect(f).to.throw(TypeError, /Future.*Stream/);
      });

      it('resolves with concatenated value of the Stream has produced', done => {
        const tr = through();
        const actual = tryS(_ => {
          tr.write('qux');
          return tr;
        });

        process.nextTick(() => {
            tr.end('quux');
        });

        return void U.assertResolved(actual, 'quxquux').then(done, done);
      });

      /* TODO: it('rejects with the emitted error', done => { }); */

    });

  });

});
