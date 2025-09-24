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
  code: number;
  name: string;
  slug: string;
  Description: string;
};
export const authors: Author[] = [
  {
    code: 1,
    name: "Janakiraman",
    slug: "Janakiraman",
    Description: "புகழ் பெற்ற தமிழ் எழுத்தாளர். தி.ஜா. என்றும் அழைக்கப்படுபவர். தமிழின் மிகப்புகழ் பெற்ற நாவல்களான மோகமுள், மரப்பசு, அம்மா வந்தாள் போன்றவற்றை எழுதியவர்.",
    
  },
  {
    code: 2,
    name: "Vairamuthu",
    slug: "Vairamuthu",
    Description: "புகழ் பெற்ற தமிழ்த் திரைப்படப் பாடலாசிரியர் மற்றும் கவிஞர். சிறந்த பாடலாசிரியருக்கான இந்திய அரசின் விருதை ஏழு முறை பெற்றுள்ளார்.",
    
  },{
    code: 3,
    name: "Sujatha",
    slug: "Sujatha",
    Description: "தமிழகத்தின் குறிப்பிடத்தக்க எழுத்தாளர்களில் ஒருவராவார். இயற்பெயர் ரங்கராஜன். தனது தனிப்பட்ட கற்பனை மற்றும் நடையால் பல வாசகர்களை கவர்ந்தவர்.",
    
  },{
    code: 4,
    name: "Rajesh Kumar",
    slug: "Rajesh Kumar",
    Description: "கோபிநாத் விஜய் தொலைக்காட்சியில் நிகழ்ச்சி தொகுப்பாளராகவும், தனியார் பண்பலை ஒன்றில் வானொலி நிகழ்ச்சி தொகுப்பாளராகவும் பணியாற்றுகிறார். தற்போது ஒரு எழுத்தாளராகவும் பரிணமித்து வருகிறார்.",
    
  },
];

export type Publisher = {
  code: number;
  image: string;
  author: string;
  bookTypes: string;
  action: "Active" | "Invited" | "Disabled";
};
export const publishers: Publisher[] = [
  {
    code: 1,
    image: "Alice Johnson",
    author: "Jothilakshmi",
    bookTypes: "Hardcover",
    action: "Active",
  },
];

export type Supplier = {
  code: number;
  image: string;
  author: string;
  bookTypes: string;
  action: "Active" | "Invited" | "Disabled";
};
export const suppliers: Supplier[] = [
  {
    code: 1,
    image: "Alice Johnson",
    author: "Vairamuthu",
    bookTypes: "Hardcover",
    action: "Active",
  },
];
