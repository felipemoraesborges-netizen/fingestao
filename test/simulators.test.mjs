import test from 'node:test';
import assert from 'node:assert/strict';
import { simulate, simulators } from '../src/learning/simulators.ts';

function run(id, overrides) {
  const simulation = simulators.find(item => item.id === id);
  assert.ok(simulation);
  const defaults = Object.fromEntries(simulation.fields.map(field => [field.name, field.initial]));
  return simulate(simulation, { ...defaults, ...overrides });
}

test('os quinze simuladores geram séries finitas com as hipóteses ilustrativas', () => {
  assert.equal(simulators.length, 15);
  for (const simulation of simulators) {
    const result = run(simulation.id);
    assert.ok(result.points.length > 0 && result.points.every(point => Number.isFinite(point.value)));
    assert.ok(result.summary.every(item => typeof item.value === 'string' || Number.isFinite(item.value)));
  }
});

test('contas simples conhecidas, preços e limites', () => {
  assert.equal(run('simples', { principal: 1000, months: 4, rate: 1 }).points.at(-1).value, 1040);
  assert.ok(Math.abs(run('compostos', { principal: 1000, deposit: 0, months: 2, rate: 1 }).points.at(-1).value - 1020.1) < 0.001);
  assert.equal(run('imovel', { price: 1200, down: 0, rate: 0, months: 12, extra: 0 }).summary.at(-1).value, 1200);
  assert.ok(run('veiculo', { price: 1000, down: 0, months: 12, extra: 0, rate: 1 }).points.at(-1).value < 0.001);
  assert.equal(run('quitacao', { principal: 1000, payment: 100, rate: 0, months: 10 }).summary.at(-1).value, 10);
  assert.equal(run('quitacao', { principal: 1000, payment: 0, rate: 1, months: 10 }).summary.at(-1).value, 'Não quitada no período');
  assert.throws(() => run('imovel', { price: 1000, down: 1001 }), /entrada/);
  assert.throws(() => run('compostos', { months: 0 }), /Duração/);
});
