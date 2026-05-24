import assert from 'node:assert';

import { prisma } from '../utils/prisma.ts';

import {
	getMerchantList,
	getMerchantById,
	createMerchant,
	updateMerchant,
	deleteMerchantByName,
    resetCache_MerchantList,
} from '../services/merchant_service.ts';

describe('Merchant Service Tests', () => {
	const baseMerchantPayload = {
		name: 'MerchantService-Base',
		region: 'EU',
		email: 'merchant-service-base@opences.org',
		phone: '+3211111111',
		website: 'https://merchant-service-base.opences.org',
		address: '1 Service Test Street',
		latitude: 50.8503,
		longitude: 4.3517,
	};

	let baseMerchantId;

	before(async () => {
		await deleteMerchantByName(baseMerchantPayload.name);
		await resetCache_MerchantList();

		const merchant = await prisma.merchant.create({ data: baseMerchantPayload });
		baseMerchantId = merchant.id;
	});

	after(async () => {
		await deleteMerchantByName(baseMerchantPayload.name);
		await deleteMerchantByName('MerchantService-Create');
		await deleteMerchantByName('MerchantService-Update');
		await resetCache_MerchantList();
	});

	it('getMerchantList returns the seeded merchant', async () => {
		await resetCache_MerchantList();

		const merchants = await getMerchantList();

		assert.ok(Array.isArray(merchants));

		const found = merchants.find((merchant) => merchant.id === baseMerchantId);
		assert.ok(found);
		assert.strictEqual(found.name, baseMerchantPayload.name);
		assert.strictEqual(found.region, baseMerchantPayload.region);
		assert.strictEqual(found.email, baseMerchantPayload.email);
		assert.strictEqual(found.phone, baseMerchantPayload.phone);
		assert.strictEqual(found.website, baseMerchantPayload.website);
		assert.strictEqual(found.address, baseMerchantPayload.address);
		assert.ok(found.createdAt);
		assert.ok(found.updatedAt);
	});

	it('getMerchantById returns the seeded merchant', async () => {
		const merchant = await getMerchantById(baseMerchantId);

		assert.ok(merchant);
		assert.strictEqual(merchant.id, baseMerchantId);
		assert.strictEqual(merchant.name, baseMerchantPayload.name);
		assert.strictEqual(merchant.region, baseMerchantPayload.region);
		assert.strictEqual(merchant.email, baseMerchantPayload.email);
		assert.strictEqual(merchant.phone, baseMerchantPayload.phone);
		assert.strictEqual(merchant.website, baseMerchantPayload.website);
		assert.strictEqual(merchant.address, baseMerchantPayload.address);
		assert.ok(merchant.createdAt);
		assert.ok(merchant.updatedAt);
	});

	it('getMerchantById returns null when merchant does not exist', async () => {
		const merchant = await getMerchantById(99999999);

		assert.strictEqual(merchant, null);
	});

	it('createMerchant creates and persists a merchant', async () => {
		const createPayload = {
			name: 'MerchantService-Create',
			region: 'BE',
			email: 'merchant-service-create@opences.org',
			phone: '+3222222222',
			website: 'https://merchant-service-create.opences.org',
			address: '2 Create Test Street',
			latitude: 51.2194,
			longitude: 4.4025,
		};

		try {
			await resetCache_MerchantList();

			const created = await createMerchant(createPayload);

			assert.ok(created);
			assert.strictEqual(created.name, createPayload.name);
			assert.strictEqual(created.region, createPayload.region);
			assert.strictEqual(created.email, createPayload.email);
			assert.strictEqual(created.phone, createPayload.phone);
			assert.strictEqual(created.website, createPayload.website);
			assert.strictEqual(created.address, createPayload.address);
			assert.ok(created.id);
			assert.ok(created.createdAt);
			assert.ok(created.updatedAt);

			const persisted = await getMerchantById(created.id);
			assert.ok(persisted);
			assert.strictEqual(persisted.name, createPayload.name);
			assert.strictEqual(persisted.region, createPayload.region);
			assert.strictEqual(persisted.email, createPayload.email);
		} finally {
			await deleteMerchantByName(createPayload.name);
			await resetCache_MerchantList();
		}
	});

	it('updateMerchant modifies and persists merchant fields', async () => {
		const createPayload = {
			name: 'MerchantService-Update',
			region: 'NL',
			email: 'merchant-service-update@opences.org',
			phone: '+3233333333',
			website: 'https://merchant-service-update.opences.org',
			address: '3 Update Test Street',
			latitude: 52.3676,
			longitude: 4.9041,
		};

		try {
			const merchant = await createMerchant(createPayload);

			const updatePayload = {
				name: 'MerchantService-Update',
				region: 'FR',
				email: 'merchant-service-update-new@opences.org',
				phone: '+3244444444',
				website: 'https://merchant-service-update-new.opences.org',
				address: '4 Updated Service Street',
			};

			const updated = await updateMerchant(merchant.id, updatePayload);

			assert.ok(updated);
			assert.strictEqual(updated.id, merchant.id);
			assert.strictEqual(updated.name, updatePayload.name);
			assert.strictEqual(updated.region, updatePayload.region);
			assert.strictEqual(updated.email, updatePayload.email);
			assert.strictEqual(updated.phone, updatePayload.phone);
			assert.strictEqual(updated.website, updatePayload.website);
			assert.strictEqual(updated.address, updatePayload.address);

			const persisted = await getMerchantById(merchant.id);
			assert.ok(persisted);
			assert.strictEqual(persisted.region, updatePayload.region);
			assert.strictEqual(persisted.email, updatePayload.email);
			assert.strictEqual(persisted.phone, updatePayload.phone);
			assert.strictEqual(persisted.website, updatePayload.website);
			assert.strictEqual(persisted.address, updatePayload.address);
		} finally {
			await deleteMerchantByName(createPayload.name);
			await resetCache_MerchantList();
		}
	});
});
