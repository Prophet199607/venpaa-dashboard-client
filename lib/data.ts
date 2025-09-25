export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Invited" | "Disabled";
};
export const users: User[] = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "Admin",
    status: "Active",
  },
  {
    id: 2,
    name: "Bob Martin",
    email: "bob@example.com",
    role: "Manager",
    status: "Invited",
  },
  {
    id: 3,
    name: "Carla Wright",
    email: "carla@example.com",
    role: "Viewer",
    status: "Active",
  },
  {
    id: 4,
    name: "David Lee",
    email: "david@example.com",
    role: "Editor",
    status: "Disabled",
  },
];

export type BookType = {
  id: number;
  bookCode: string;
  bookName: string;
};
export const bookTypes: BookType[] = [
  {
    id: 1,
    bookCode: "BT0001",
    bookName: "Hardcover",
  },
  {
    id: 2,
    bookCode: "BT0002",
    bookName: "Paperback",
  },
  {
    id: 3,
    bookCode: "BT0003",
    bookName: "Audio Book",
  },
];

export type Book = {
  code: number;
  image: string;
  author: string;
  bookTypes: string;
  action: "Active" | "Invited" | "Disabled";
};
export const books: Book[] = [
  {
    code: 1,
    image: "Alice Johnson",
    author: "Vairamuthu",
    bookTypes: "Hardcover",
    action: "Active",
  },
  {
    code: 2,
    image: "Bob Martin",
    author: "Kalki",
    bookTypes: "Paperback",
    action: "Invited",
  },
  {
    code: 3,
    image: "Carla Wright",
    author: "Janakiraman",
    bookTypes: "Audio Book",
    action: "Active",
  },
  {
    code: 4,
    image: "David Lee",
    author: "Guna Kaviyazhagan",
    bookTypes: "Audio Book",
    action: "Disabled",
  },
];

export type Location = {
  id: number;
  locCode: string;
  locName: string;
  location: string;
};
export const locations: Location[] = [
  {
    id: 1,
    locCode: "L0001",
    locName: "HeadBranch",
    location: "Jaffna",
  },
  {
    id: 2,
    locCode: "L0002",
    locName: "Colombo",
    location: "Wallewatthe",
  },
  {
    id: 3,
    locCode: "L0003",
    locName: "COLOMBO",
    location: "BMICH",
  },
  {
    id: 4,
    locCode: "L0004",
    locName: "Jaffna Trade Fair",
    location: "Jaffna",
  },
];

export type SubCategory = {
  id: number;
  subCatCode: string;
  subCatName: string;
};
export const subCategories: SubCategory[] = [
  {
    id: 1,
    subCatCode: "SC0001",
    subCatName: "Historical Fiction",
  },
  {
    id: 2,
    subCatCode: "SC0002",
    subCatName: "Poetry",
  },
  {
    id: 3,
    subCatCode: "SC0003",
    subCatName: "Short Stories & Drama",
  },
  {
    id: 4,
    subCatCode: "SC0004",
    subCatName: "Novel & Literature",
  },
  {
    id: 5,
    subCatCode: "SC0005",
    subCatName: "Comics & Graphic Novels",
  },
];

export type Category = {
  catCode: string;
  catName: string;
  slug: string;
  subCategories: string;
};
export const categories: Category[] = [
  {
    catCode: "C0001",
    catName: "Fiction",
    slug: "fiction",
    subCategories:
      "Historical Fiction, Poetry, Short Stories & Drama, Novel & Literature, Comics & Graphic Novels",
  },
  {
    catCode: "C0002",
    catName: "Non-Fiction",
    slug: "non-fiction",
    subCategories:
      "Biography & Memoir, Travel & Adventure, Self-Improvement & Personal Development, Health & Fitness, Cookbooks & Food",
  },
  {
    catCode: "C0003",
    catName: "Children & Teen",
    slug: "children-teen",
    subCategories: "Children's Books, Teen's Books",
  },
  {
    catCode: "C0004",
    catName: "Academic Books",
    slug: "academic-books",
    subCategories: "Academic Books",
  },
  {
    catCode: "C0005",
    catName: "Poetry",
    slug: "poetry",
    subCategories: "Poetry",
  },
];

export type Author = {
  authCode: string;
  authName: string;
  authNameTamil: string;
  slug: string;
  description: string;
};
export const authors: Author[] = [
  {
    authCode: "A0001",
    authName: "Janakiraman",
    authNameTamil: "ஜானகிரமன்",
    slug: "janakiraman",
    description:
      "புகழ் பெற்ற தமிழ் எழுத்தாளர். தி.ஜா. என்றும் அழைக்கப்படுபவர். தமிழின் மிகப்புகழ் பெற்ற நாவல்களான மோகமுள், மரப்பசு, அம்மா வந்தாள் போன்றவற்றை எழுதியவர்.",
  },
  {
    authCode: "A0002",
    authName: "Vairamuthu",
    authNameTamil: "வைரமுது",
    slug: "vairamuthu",
    description:
      "புகழ் பெற்ற தமிழ்த் திரைப்படப் பாடலாசிரியர் மற்றும் கவிஞர். சிறந்த பாடலாசிரியருக்கான இந்திய அரசின் விருதை ஏழு முறை பெற்றுள்ளார்.",
  },
  {
    authCode: "A0003",
    authName: "Sujatha",
    authNameTamil: "சுஜதா",
    slug: "Sujatha",
    description:
      "தமிழகத்தின் குறிப்பிடத்தக்க எழுத்தாளர்களில் ஒருவராவார். இயற்பெயர் ரங்கராஜன். தனது தனிப்பட்ட கற்பனை மற்றும் நடையால் பல வாசகர்களை கவர்ந்தவர்.",
  },
  {
    authCode: "A0004",
    authName: "Rajesh Kumar",
    authNameTamil: "ரஜேஷ் குமார்",
    slug: "Rajesh Kumar",
    description:
      "கோபிநாத் விஜய் தொலைக்காட்சியில் நிகழ்ச்சி தொகுப்பாளராகவும், தனியார் பண்பலை ஒன்றில் வானொலி நிகழ்ச்சி தொகுப்பாளராகவும் பணியாற்றுகிறார். தற்போது ஒரு எழுத்தாளராகவும் பரிணமித்து வருகிறார்.",
  },
];

export type Publisher = {
  id: number;
  pubCode: string;
  pubName: string;
  slug: string;
  description: string;
  contact: string;
  email: string;
  website: string;
  image?: string;
};

export const publishers: Publisher[] = [
  {
    id: 1,
    pubCode: "PUB001",
    pubName: "Sarasavi Publishers",
    slug: "sarasavi-publishers",
    description:
      "One of Sri Lanka’s leading publishers, specializing in Sinhala and English educational books, novels, and translations.",
    contact: "+94 11 278 5252",
    email: "info@sarasavi.lk",
    website: "https://www.sarasavi.lk",
    image: "/images/publishers/sarasavi.png",
  },
  {
    id: 2,
    pubCode: "PUB002",
    pubName: "MD Gunasena Publishers",
    slug: "md-gunasena",
    description:
      "A well-known publisher and bookseller in Sri Lanka, offering textbooks, children’s books, and general literature.",
    contact: "+94 11 243 5977",
    email: "support@mdgunasena.com",
    website: "https://www.mdgunasena.com",
    image: "/images/publishers/gunasena.png",
  },
  {
    id: 3,
    pubCode: "PUB003",
    pubName: "Godage International Publishers",
    slug: "godage-international",
    description:
      "Renowned for publishing a wide range of Sinhala, Tamil, and English books, including research and academic works.",
    contact: "+94 11 269 8717",
    email: "info@godage.com",
    website: "http://www.godage.com",
    image: "/images/publishers/godage.png",
  },
  {
    id: 4,
    pubCode: "PUB004",
    pubName: "Vijitha Yapa Publishers",
    slug: "vijitha-yapa",
    description:
      "Sri Lanka’s first and largest international bookseller, publishing works by local and international authors.",
    contact: "+94 11 243 4600",
    email: "info@vijithayapa.com",
    website: "https://www.vijithayapa.com",
    image: "/images/publishers/vijitha.png",
  },
  {
    id: 5,
    pubCode: "PUB005",
    pubName: "Samayawardhana Publishers",
    slug: "samayawardhana",
    description:
      "A trusted name in Sri Lankan publishing, focusing on school textbooks, story books, and general knowledge.",
    contact: "+94 11 281 9542",
    email: "info@samayawardhana.lk",
    website: "http://www.samayawardhana.lk",
    image: "/images/publishers/samayawardhana.png",
  },
];

export type Supplier = {
  id: number;
  supCode: string;
  supName: string;
  company: string;
  address: string;
  mobile: string;
  telephone: string;
  email: string;
  note?: string;
  image?: string;
};

export const suppliers: Supplier[] = [
  {
    id: 1,
    supCode: "S0001",
    supName: "Nimal Perera",
    company: "Perera Distributors",
    address: "45 Galle Road, Colombo 03",
    mobile: "+94 77 123 4567",
    telephone: "011-2345678",
    email: "nimal@pereradistributors.lk",
    note: "Main supplier of local textbooks and stationery.",
    image: "/images/suppliers/nimal.png",
  },
  {
    id: 2,
    supCode: "S0002",
    supName: "Sivakumar Raj",
    company: "Raj Publishers",
    address: "12 KKS Road, Jaffna",
    mobile: "+94 77 987 6543",
    telephone: "021-2233445",
    email: "siva@rajpublishers.lk",
    note: "Supplies Tamil literature and regional publications.",
    image: "/images/suppliers/siva.png",
  },
  {
    id: 3,
    supCode: "S0003",
    supName: "Chandani Silva",
    company: "Silva Book Supplies",
    address: "88 Baseline Road, Colombo 09",
    mobile: "+94 71 222 3344",
    telephone: "011-2678901",
    email: "chandani@silvabooks.lk",
    note: "Trusted supplier for imported novels and magazines.",
    image: "/images/suppliers/chandani.png",
  },
  {
    id: 4,
    supCode: "S0004",
    supName: "K. Thayaparan",
    company: "Thayaparan Distributors",
    address: "5 Stanley Road, Jaffna",
    mobile: "+94 76 555 6677",
    telephone: "021-2267890",
    email: "thaya@thayadistributors.lk",
    note: "Provides school supplies and children’s story books.",
    image: "/images/suppliers/thaya.png",
  },
  {
    id: 5,
    supCode: "S0005",
    supName: "Anura Jayasinghe",
    company: "Jayasinghe Agencies",
    address: "101 High Level Road, Nugegoda",
    mobile: "+94 77 888 9999",
    telephone: "011-2894567",
    email: "anura@jayasingheagencies.lk",
    note: "Specializes in academic and reference books.",
    image: "/images/suppliers/anura.png",
  },
];
