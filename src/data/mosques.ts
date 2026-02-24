export interface Mosque {
  id: string;
  name: string;
  location: string;
  has_biryani: boolean;
  menu_items: string[];
  latitude: number;
  longitude: number;
  google_map_link?: string;
  true_count?: number;
  fake_count?: number;
}

export const INITIAL_MOSQUES: Mosque[] = [
  {
    id: '1',
    name: 'কান্দিরপাড় জামে মসজিদ',
    location: 'কান্দিরপাড়',
    has_biryani: true,
    menu_items: ['ছোলা', 'পিঁয়াজু', 'বেগুনি', 'আলুর চপ', 'জিলাপি', 'শরবত'],
    latitude: 23.4606,
    longitude: 91.1809,
    true_count: 0,
    fake_count: 0
  },
  {
    id: '2',
    name: 'চকবাজার শাহী মসজিদ',
    location: 'চকবাজার',
    has_biryani: false,
    menu_items: ['ছোলা', 'মুড়ি', 'পিঁয়াজু', 'খেজুর', 'আপেল'],
    latitude: 23.4550,
    longitude: 91.1850,
    true_count: 0,
    fake_count: 0
  },
  {
    id: '3',
    name: 'টমছম ব্রিজ মসজিদ',
    location: 'টমছম ব্রিজ',
    has_biryani: true,
    menu_items: ['তেহারি', 'বোরহানি', 'সালাদ', 'খেজুর'],
    latitude: 23.4480,
    longitude: 91.1750,
    true_count: 0,
    fake_count: 0
  },
  {
    id: '4',
    name: 'পুলিশ লাইন জামে মসজিদ',
    location: 'পুলিশ লাইন',
    has_biryani: false,
    menu_items: ['খিচুড়ি', 'বেগুন ভাজি', 'ডিম', 'আচার'],
    latitude: 23.4650,
    longitude: 91.1700,
    true_count: 0,
    fake_count: 0
  },
  {
    id: '5',
    name: 'কুমিল্লা ক্যান্টনমেন্ট কেন্দ্রীয় মসজিদ',
    location: 'ক্যান্টনমেন্ট',
    has_biryani: true,
    menu_items: ['স্পেশাল হালিম', 'ছোলা', 'জিলাপি', 'জুস', 'খেজুর'],
    latitude: 23.4800,
    longitude: 91.1300,
    true_count: 0,
    fake_count: 0
  },
  {
    id: '6',
    name: 'ময়নামতি ক্যান্টনমেন্ট মসজিদ',
    location: 'ময়নামতি',
    has_biryani: false,
    menu_items: ['ছোলা', 'পিঁয়াজু', 'বেগুনি', 'শরবত'],
    latitude: 23.4900,
    longitude: 91.1200,
    true_count: 0,
    fake_count: 0
  }
];
