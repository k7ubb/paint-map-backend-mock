import { describe, it, expect } from 'vitest';
import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
// const BASE_URL = 'http://paint-map.localhost/api';

describe('API Tests', () => {
	let userId: string;

	describe('Account Management', () => {
		it('should get account count', async () => {
			const res = await axios.get(BASE_URL + '/', {
				params: { function: 'account_count' }
			});
			
			expect(res.data.succeed).toBe(true);
			expect(typeof res.data.count).toBe('number');
		});

		it('should create a new account', async () => {
			const res = await axios.get(BASE_URL + '/', {
				params: {
					function: 'account_create',
					user_name: 'testuser',
					password: 'password',
					type: 'city',
					share_level: 1
				}
			});
			
			expect(res.data.succeed).toBe(true);
			expect(res.data.id).toBeDefined();
			userId = res.data.id;
		});

		it('should not create duplicate account', async () => {
			const res = await axios.get(BASE_URL + '/', {
				params: {
					function: 'account_create',
					user_name: 'testuser',
					password: 'password2',
				}
			});
			
			expect(res.data.succeed).toBe(false);
			expect(res.data.error).toContain('already exists');
		});

		it('should authenticate with correct credentials', async () => {
			const res = await axios.get(BASE_URL + '/', {
				params: {
					function: 'account_auth',
					user_name: 'testuser',
					password: 'password',
				}
			});
			
			expect(res.data.succeed).toBe(true);
			expect(res.data.login).toBe(true);
			expect(res.data.id).toBe(userId);
		});

		it('should fail authentication with wrong password', async () => {
			const res = await axios.get(BASE_URL + '/', {
				params: {
					function: 'account_auth',
					user_name: 'testuser',
					password: 'wrongpassword'
				}
			});
			
			expect(res.data.succeed).toBe(true);
			expect(res.data.login).toBe(false);
		});

		it('should fail authentication with non-existent user', async () => {
			const res = await axios.get(BASE_URL + '/', {
				params: {
					function: 'account_auth',
					user_name: 'nonexistent',
					password: 'password'
				}
			});
			
			expect(res.data.succeed).toBe(true);
			expect(res.data.login).toBe(false);
		});

		it('should change password', async () => {
			const newPassword = 'newpass456';
			const res = await axios.get(BASE_URL + '/', {
				params: {
					function: 'account_password_change',
					user_name: 'testuser',
					password: 'password',
					password_new: newPassword
				}
			});
			
			expect(res.data.succeed).toBe(true);
			
			// Verify new password works
			const authRes = await axios.get(BASE_URL + '/', {
				params: {
					function: 'account_auth',
					user_name: 'testuser',
					password: newPassword
				}
			});
			expect(authRes.data.login).toBe(true);

			await axios.get(BASE_URL + '/', {
				params: {
					function: 'account_password_change',
					user_name: 'testuser',
					password: newPassword,
					password_new: 'password',
				}
			});
		});
	});

	describe('Map Management', () => {
		it('should get user map', async () => {
			const res = await axios.get(BASE_URL + '/', {
				params: {
					function: 'account_map_get',
					user_name: 'testuser',
					password: 'password',
				}
			});
			
			expect(res.data.type).toBe('city');
			expect(res.data.title).toBeDefined();
			expect(res.data.legend).toBeInstanceOf(Array);
			expect(res.data.data).toBeDefined();
		});

		it('should generate a new map', async () => {
			const res = await axios.get(BASE_URL + '/', {
				params: {
					function: 'map_get_empty',
					type: 'pref',
					share_level: 1
				}
			});
			
			expect(res.data.type).toBe('pref');
			expect(res.data.title).toBe('無題の地図');
			expect(res.data.legend).toHaveLength(4);
			expect(res.data.data).toEqual({});
		});

		it('should save map data', async () => {
			const mapData = {
				id: userId,
				type: 'city',
				title: 'Test Map',
				description: 'Test Description',
				legend: [
					{ title: 'Level 1', color: '#FF0000' },
					{ title: 'Level 2', color: '#00FF00' }
				],
				score_format: 2,
				data: { 'tokyo': 1, 'osaka': 2 },
				share_level: 1
			};
			
			const res = await axios.get(BASE_URL + '/', {
				params: {
					function: 'map_save',
					user_name: 'testuser',
					password: 'password',
					map: JSON.stringify(mapData)
				}
			});
			
			expect(res.data.succeed).toBe(true);
			
			// Verify the map was saved
			const getRes = await axios.get(BASE_URL + '/', {
				params: {
					function: 'account_map_get',
					user_name: 'testuser',
					password: 'password',
				}
			});
			expect(getRes.data.title).toBe('Test Map');
			expect(getRes.data.description).toBe('Test Description');
		});

		it('should fail to save map with mismatched id', async () => {
			const mapData = {
				id: 'wrongid',
				type: 'city',
				title: 'Test',
				data: {}
			};
			
			const res = await axios.get(BASE_URL + '/', {
				params: {
					function: 'map_save',
					user_name: 'testuser',
					password: 'password',
					map: JSON.stringify(mapData)
				}
			});
			
			expect(res.data.succeed).toBe(false);
			expect(res.data.error).toContain('mismatch');
		});

		it('should upload map image', async () => {
			const res = await axios.get(BASE_URL + '/', {
				params: {
					function: 'map_image_upload',
					user_name: 'testuser',
					password: 'password',
					image: 'base64encodedimage'
				}
			});
			
			expect(res.data.succeed).toBe(true);
		});
	});

	describe('Shared Maps', () => {
		it('should get shared map', async () => {
			const res = await axios.get(BASE_URL + '/', {
				params: {
					function: 'shared_map_get',
					id: userId
				}
			});
			
			expect(res.data.type).toBeDefined();
			expect(res.data.share_level).toBeGreaterThan(0);
		});

		it('should fail to get non-existent shared map', async () => {
			const res = await axios.get(BASE_URL + '/', {
				params: {
					function: 'shared_map_get',
					id: 999999999
				}
			});
			
			expect(res.data.succeed).toBe(true);
			expect(res.data.error).toContain('not exist');
		});
	});

	describe('Error Handling', () => {
		it('should return error for undefined function', async () => {
			const res = await axios.get(BASE_URL + '/', {
				params: { function: 'invalid_function' }
			});
			
			expect(res.data.succeed).toBe(false);
			expect(res.data.error).toBe('undefined function');
		});

		it('should return error for missing arguments', async () => {
			const res = await axios.get(BASE_URL + '/', {
				params: {
					function: 'account_auth',
					user_name: 'testuser',
					// missing password
				}
			});
			
			expect(res.data.succeed).toBe(false);
			expect(res.data.error).toBe('invalid arguments');
		});
	});

	describe('Cleanup', () => {
		it('should delete account', async () => {
			const res = await axios.get(BASE_URL + '/', {
				params: {
					function: 'account_delete',
					user_name: 'testuser',
					password: 'password',
				}
			});
			
			expect(res.data.succeed).toBe(true);
			
			// Verify account is deleted
			const authRes = await axios.get(BASE_URL + '/', {
				params: {
					function: 'account_auth',
					user_name: 'testuser',
					password: 'password',
				}
			});
			expect(authRes.data.login).toBe(false);
		});
	});
});
