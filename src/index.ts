import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();
app.use('/*', cors());

type Account = {
	id: string;
	userName: string;
	password: string;
}

type MapData = {
	type: string;
	title: string;
	description: string;
	legend: Array<{ title: string; color: string }>;
	score_format: number;
	data: { [key: string]: number };
	share_level: number;
	last_update: number;
	non_zero_legend?: string;
}

const accounts: Account[] = [];
const maps:{ [key: string]: MapData } = {};

const mapTemplate: {
	[key: string]: {
		type: string;
		position: { lat: number; lng: number; zoom: number };
		source: string;
		fillLayer: string;
		outlineLayer?: string;
		minZoom: number;
		maxZoom: number;
		worldCopyJump?: number;
	}
} = {
	city: {
		type: 'city',
		position: { lat: 38.5, lng: 138, zoom: 6 },
		source: '<a href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-v3_1.html" target="_blank">国土数値情報 [国交省]</a> を加工',
		fillLayer: 'data/city.json',
		outlineLayer: 'data/prefecture.json',
		minZoom: 5,
		maxZoom: 12,
	},
	ward: {
		type: 'ward',
		position: { lat: 38.5, lng: 138, zoom: 6 },
		source: '<a href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-v3_1.html" target="_blank">国土数値情報 [国交省]</a> を加工',
		fillLayer: 'data/ward.json',
		outlineLayer: 'data/prefecture.json',
		minZoom: 5,
		maxZoom: 12,
	},
	pref: {
		type: 'pref',
		position: { lat: 38.5, lng: 138, zoom: 6 },
		source: '<a href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-v3_1.html" target="_blank">国土数値情報 [国交省]</a> を加工',
		fillLayer: 'data/prefecture.json',
		minZoom: 5,
		maxZoom: 12,
	},
	'1920': {
		type: '1920',
		position: { lat: 38.5, lng: 138, zoom: 6 },
		source: '<a href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-v3_1.html" target="_blank">国土数値情報 [国交省]</a> を加工',
		fillLayer: 'data/1920-city.json',
		outlineLayer: 'data/1920-pref.json',
		minZoom: 5,
		maxZoom: 12,
	},
	gun: {
		type: 'gun',
		position: { lat: 38.5, lng: 138, zoom: 6 },
		source: '<a href="https://gunmap.booth.pm/items/3053727" target="_blank">郡地図 Ver 1.1</a>を加工',
		fillLayer: 'data/gun.json',
		outlineLayer: 'data/kuni.json',
		minZoom: 5,
		maxZoom: 12,
	},
	world: {
		type: 'world',
		position: { lat: 37, lng: 208, zoom: 2 },
		source: '<a href="https://www.naturalearthdata.com/" target="_blank">Natural Earth</a>を加工',
		fillLayer: 'data/world.json',
		minZoom: 2,
		maxZoom: 5,
		worldCopyJump: 1,
	}
};

function getMicrotime(): number {
	return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

app.get('/', (c) => {
	const func = c.req.query('function');
	
	try {
		switch (func) {
		case 'account_count': {
			return c.json({
				succeed: true,
				count: accounts.length
			});
		}
			

		case 'account_auth': {
			const userName = c.req.query('user_name');
			const password = c.req.query('password');
				
			if (!userName || !password) {
				return c.json({ succeed: false, error: 'invalid arguments' });
			}
				
			const account = accounts.find(a => a.userName === userName);
			if (!account) {
				return c.json({ succeed: true, login: false });
			}
				
			if (account.password === password) {
				return c.json({ succeed: true, login: true, id: account.id });
			}
				
			return c.json({ succeed: true, login: false });
		}
			

		case 'account_create': {
			const userName = c.req.query('user_name');
			const password = c.req.query('password');
			const type = c.req.query('type') || 'city';
			const shareLevel = parseInt(c.req.query('share_level') || '0');
				
			if (!userName || !password) {
				return c.json({ succeed: false, error: 'invalid arguments' });
			}
				
			if (accounts.find(a => a.userName === userName)) {
				return c.json({ succeed: false, error: `ID ${userName} is already exists` });
			}
				
			const id = String(getMicrotime());
				
			accounts.push({ id, userName, password });
				
			const mapData: MapData = {
				type: type,
				title: '無題の地図',
				description: '',
				legend: [
					{ title: '項目1', color: '#FFFFFF' },
					{ title: '項目2', color: '#75FBFD' },
					{ title: '項目3', color: '#FFFF54' },
					{ title: '項目4', color: '#EA3323' }
				],
				score_format: 1,
				data: {},
				share_level: shareLevel,
				last_update: getMicrotime()
			};
				
			maps[id] = mapData;
				
			return c.json({ succeed: true, id });
		}
			

		case 'account_password_change': {
			const userName = c.req.query('user_name');
			const password = c.req.query('password');
			const passwordNew = c.req.query('password_new');
				
			if (!userName || !password || !passwordNew) {
				return c.json({ succeed: false, error: 'invalid arguments' });
			}
				
			const account = accounts.find(a => a.userName === userName);
			if (!account || account.password !== password) {
				return c.json({ succeed: false, error: 'Authentication failed' });
			}
			
			account.password = passwordNew;
				
			return c.json({ succeed: true });
		}
			
		case 'account_delete': {
			const userName = c.req.query('user_name');
			const password = c.req.query('password');
				
			if (!userName || !password) {
				return c.json({ succeed: false, error: 'invalid arguments' });
			}
				
			const account = accounts.find(a => a.userName === userName);
			if (!account || account.password !== password) {
				return c.json({ succeed: false, error: 'Authentication failed' });
			}
				
			const index = accounts.findIndex(a => a.userName === userName);
			accounts.splice(index, 1);
			delete maps[account.id];
				
			return c.json({ succeed: true });
		}
			

		case 'account_map_get': {
			const userName = c.req.query('user_name');
			const password = c.req.query('password');
				
			if (!userName || !password) {
				return c.json({ succeed: false, error: 'invalid arguments' });
			}
				
			const account = accounts.find(a => a.userName === userName);
			if (!account || account.password !== password) {
				return c.json({ succeed: false, error: 'Authentication failed' });
			}
				
			const mapData = maps[account.id];
			if (!mapData) {
				return c.json({ succeed: false, error: 'Map not found' });
			}
				
			const template = mapTemplate[mapData.type] || mapTemplate['city'];
				
			return c.json({
				...mapData,
				id: account.id,
				...template
			});
		}
			
		case 'map_get_empty': {
			const type = c.req.query('type') || 'city';
			const shareLevel = parseInt(c.req.query('share_level') || '0');
			
			const template = mapTemplate[type] || mapTemplate['city'];

			return c.json({
				title: '無題の地図',
				description: '',
				legend: [
					{ title: '項目1', color: '#FFFFFF' },
					{ title: '項目2', color: '#75FBFD' },
					{ title: '項目3', color: '#FFFF54' },
					{ title: '項目4', color: '#EA3323' }
				],
				score_format: 1,
				data: {},
				share_level: shareLevel,
				last_update: getMicrotime(),
				...template
			});
		}
			

		case 'map_save': {
			const userName = c.req.query('user_name');
			const password = c.req.query('password');
			const mapJson = c.req.query('map');
				
			if (!userName || !password || !mapJson) {
				return c.json({ succeed: false, error: 'invalid arguments' });
			}
				
			const account = accounts.find(a => a.userName === userName);
			if (!account || account.password !== password) {
				return c.json({ succeed: false, error: 'Authentication failed' });
			}
				
			const mapData_ = JSON.parse(mapJson);
			if (mapData_.id !== account.id) {
				return c.json({ succeed: false, error: 'Authentication mismatch' });
			}
				
			const mapData: MapData = {
				type: mapData_.type || 'city',
				title: mapData_.title || '無題の地図',
				description: mapData_.description || '',
				legend: mapData_.legend || [
					{ title: '項目1', color: '#FFFFFF' },
					{ title: '項目2', color: '#75FBFD' },
					{ title: '項目3', color: '#FFFF54' },
					{ title: '項目4', color: '#EA3323' }
				],
				score_format: mapData_.score_format || 1,
				data: mapData_.data || {},
				share_level: mapData_.share_level || 1,
				last_update: getMicrotime()
			};
				
			if (mapData_.non_zero_legend) {
				mapData.non_zero_legend = mapData_.non_zero_legend;
			}
				
			maps[account.id] = mapData;
				
			return c.json({ succeed: true });
		}
			
			
		case 'map_image_upload': {
			const userName = c.req.query('user_name');
			const password = c.req.query('password');
			const image = c.req.query('image');
				
			if (!userName || !password || !image) {
				return c.json({ succeed: false, error: 'invalid arguments' });
			}
				
			const account = accounts.find(a => a.userName === userName);
			if (!account || account.password !== password) {
				return c.json({ succeed: false, error: 'Authentication failed' });
			}
				
			// skip image saving process
				
			return c.json({ succeed: true });
		}

			
		case 'shared_map_get': {
			const id = parseInt(c.req.query('id') || '0');
				
			if (!id) {
				return c.json({ succeed: false, error: 'invalid arguments' });
			}
				
			const mapData = maps[id];
			if (!mapData) {
				return c.json({ succeed: true, error: `map ${id} is not exist` });
			}
				
			if (mapData.share_level === 0) {
				return c.json({ succeed: false, error: `map ${id} is not shared` });
			}
				
			const template = mapTemplate[mapData.type] || mapTemplate['city'];
				
			return c.json({
				...mapData,
				id,
				...template
			});
		}
			
		default:
			return c.json({ succeed: false, error: 'undefined function' });
		}
	} catch (error) {
		return c.json({ succeed: false, error: String(error) });
	}
});

serve({
	fetch: app.fetch,
	port: 3000
}, (info) => {
	console.log(`Server is running on http://localhost:${info.port}`);
});
