// Mock menu data for the restaurant
export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string; // image URL or local asset path
  category: string;
};

export type MenuCategory = {
  id: string;
  name: string;
};

export const menuCategories: MenuCategory[] = [
  { id: 'all', name: 'All' },
  { id: 'starters', name: 'Starters' },
  { id: 'grill', name: 'Grill' },
  { id: 'burgers', name: 'Burgers' },
  { id: 'drinks', name: 'Drinks' },
  { id: 'desserts', name: 'Desserts' },
];

export const menuItems: MenuItem[] = [
  // Starters
  {
    id: '1',
    name: 'Buffalo Wings',
    description: 'Spicy chicken wings served with blue cheese dip and celery sticks.',
    price: 12.99,
    image: '',
    category: 'starters',
  },
  {
    id: '2',
    name: 'Loaded Nachos',
    description: 'Crispy tortilla chips with cheese, jalapeños, sour cream, and guacamole.',
    price: 10.99,
    image: '',
    category: 'starters',
  },
  {
    id: '3',
    name: 'Mozzarella Sticks',
    description: 'Golden fried mozzarella with marinara sauce.',
    price: 8.99,
    image: '',
    category: 'starters',
  },
  {
    id: '4',
    name: 'Spinach Artichoke Dip',
    description: 'Creamy spinach and artichoke dip with warm tortilla chips.',
    price: 9.99,
    image: '',
    category: 'starters',
  },
  
  // Grill
  {
    id: '5',
    name: 'Grilled Ribeye Steak',
    description: 'Premium 12oz ribeye steak grilled to perfection with garlic butter.',
    price: 28.99,
    image: '',
    category: 'grill',
  },
  {
    id: '6',
    name: 'BBQ Ribs',
    description: 'Fall-off-the-bone baby back ribs with house BBQ sauce.',
    price: 24.99,
    image: '',
    category: 'grill',
  },
  {
    id: '7',
    name: 'Grilled Salmon',
    description: 'Fresh Atlantic salmon with lemon herb seasoning.',
    price: 22.99,
    image: '',
    category: 'grill',
  },
  {
    id: '8',
    name: 'Chicken Breast',
    description: 'Grilled chicken breast with rosemary and thyme.',
    price: 18.99,
    image: '',
    category: 'grill',
  },
  
  // Burgers
  {
    id: '9',
    name: 'Classic Cheeseburger',
    description: 'Beef patty, cheddar cheese, lettuce, tomato, onion, and pickles.',
    price: 14.99,
    image: '',
    category: 'burgers',
  },
  {
    id: '10',
    name: 'BBQ Bacon Burger',
    description: 'Beef patty with crispy bacon, BBQ sauce, and onion rings.',
    price: 16.99,
    image: '',
    category: 'burgers',
  },
  {
    id: '11',
    name: 'Mushroom Swiss Burger',
    description: 'Beef patty topped with sautéed mushrooms and Swiss cheese.',
    price: 15.99,
    image: '',
    category: 'burgers',
  },
  {
    id: '12',
    name: 'Veggie Burger',
    description: 'House-made black bean patty with avocado and sprouts.',
    price: 13.99,
    image: '',
    category: 'burgers',
  },
  
  // Drinks
  {
    id: '13',
    name: 'Craft Beer',
    description: 'Selection of local craft beers on tap.',
    price: 6.99,
    image: '',
    category: 'drinks',
  },
  {
    id: '14',
    name: 'House Wine',
    description: 'Red or white wine by the glass.',
    price: 7.99,
    image: '',
    category: 'drinks',
  },
  {
    id: '15',
    name: 'Old Fashioned',
    description: 'Classic whiskey cocktail with orange and cherry.',
    price: 11.99,
    image: '',
    category: 'drinks',
  },
  {
    id: '16',
    name: 'Soft Drinks',
    description: 'Coca-Cola, Pepsi, Sprite, or other sodas.',
    price: 2.99,
    image: '',
    category: 'drinks',
  },
  
  // Desserts
  {
    id: '17',
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with molten center and vanilla ice cream.',
    price: 8.99,
    image: '',
    category: 'desserts',
  },
  {
    id: '18',
    name: 'Cheesecake',
    description: 'New York style cheesecake with berry compote.',
    price: 7.99,
    image: '',
    category: 'desserts',
  },
  {
    id: '19',
    name: 'Apple Pie',
    description: 'Traditional apple pie with cinnamon and vanilla ice cream.',
    price: 6.99,
    image: '',
    category: 'desserts',
  },
  {
    id: '20',
    name: 'Ice Cream Sundae',
    description: 'Three scoops with chocolate sauce, whipped cream, and cherry.',
    price: 5.99,
    image: '',
    category: 'desserts',
  },
];
