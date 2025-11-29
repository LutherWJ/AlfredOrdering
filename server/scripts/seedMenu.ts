import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import Menu from '../models/Menu';
import connectDB from '../config/connection';

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

// ============================================================================
// Builder Pattern Classes
// ============================================================================

class MenuExtraBuilder {
    private extra: any = {
        extra_id: new mongoose.Types.ObjectId(),
        is_available: true,
        is_required: false,
        max_selectable: 1,
        display_order: 0,
        extras: []  // Support nested extras
    };

    name(name: string) {
        this.extra.extra_name = name;
        return this;
    }

    description(desc: string) {
        this.extra.extra_description = desc;
        return this;
    }

    price(price: number) {
        this.extra.price_delta = price;
        return this;
    }

    required(isRequired: boolean = true) {
        this.extra.is_required = isRequired;
        return this;
    }

    maxSelectable(max: number) {
        this.extra.max_selectable = max;
        return this;
    }

    order(order: number) {
        this.extra.display_order = order;
        return this;
    }

    unavailable() {
        this.extra.is_available = false;
        return this;
    }

    // NEW: Add nested extras for complex menu structures (e.g., meals)
    addExtra(nestedExtra: MenuExtraBuilder) {
        this.extra.extras.push(nestedExtra.build());
        return this;
    }

    build() {
        return this.extra;
    }
}

class MenuItemBuilder {
    private item: any = {
        item_id: new mongoose.Types.ObjectId(),
        is_available: true,
        is_vegetarian: false,
        is_vegan: false,
        is_gluten_free: false,
        prep_time: 15,
        max_per_order: 10,
        extras: []
    };

    name(name: string) {
        this.item.item_name = name;
        return this;
    }

    description(desc: string) {
        this.item.description = desc;
        return this;
    }

    price(price: number) {
        this.item.base_price = price;
        return this;
    }

    image(url: string) {
        this.item.image_url = url;
        return this;
    }

    vegetarian() {
        this.item.is_vegetarian = true;
        return this;
    }

    vegan() {
        this.item.is_vegan = true;
        this.item.is_vegetarian = true; // Vegan implies vegetarian
        return this;
    }

    glutenFree() {
        this.item.is_gluten_free = true;
        return this;
    }

    prepTime(minutes: number) {
        this.item.prep_time = minutes;
        return this;
    }

    maxPerOrder(max: number) {
        this.item.max_per_order = max;
        return this;
    }

    unavailable() {
        this.item.is_available = false;
        return this;
    }

    addExtra(extra: MenuExtraBuilder) {
        this.item.extras.push(extra.build());
        return this;
    }

    build() {
        return this.item;
    }
}

class MenuGroupBuilder {
    private group: any = {
        group_id: new mongoose.Types.ObjectId(),
        is_active: true,
        items: [],
        display_order: 0
    };

    name(name: string) {
        this.group.group_name = name;
        return this;
    }

    order(order: number) {
        this.group.display_order = order;
        return this;
    }

    inactive() {
        this.group.is_active = false;
        return this;
    }

    addItem(item: MenuItemBuilder) {
        this.group.items.push(item.build());
        return this;
    }

    build() {
        return this.group;
    }
}

class MenuBuilder {
    private menu: any = {
        restaurant_id: new mongoose.Types.ObjectId(),
        is_active: true,
        groups: []
    };

    restaurant(name: string, location: string, phone?: string) {
        this.menu.restaurant_name = name;
        this.menu.restaurant_location = location;
        this.menu.restaurant_phone = phone;
        return this;
    }

    inactive() {
        this.menu.is_active = false;
        return this;
    }

    addGroup(group: MenuGroupBuilder) {
        this.menu.groups.push(group.build());
        return this;
    }

    build() {
        return this.menu;
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

export const extra = () => new MenuExtraBuilder();
export const item = () => new MenuItemBuilder();
export const group = () => new MenuGroupBuilder();
export const menu = () => new MenuBuilder();

// ============================================================================
// Sample Data - CUSTOMIZE THIS SECTION
// ============================================================================

const campusGrill = menu()
    .restaurant('Campus Grill', 'Powell Campus Center', '+1-607-555-0200')
    // ========== VALUE MEALS (Demonstrates Nested Extras) ==========
    .addGroup(
        group()
            .name('Value Meals')
            .order(0)
            .addItem(
                item()
                    .name('Classic Combo')
                    .description('Choose your main, side, and drink - all at one great price!')
                    .price(10.99)
                    .image('/images/menu/combo-meal.jpg')
                    .prepTime(20)
                    // LEVEL 1: Entree Selection (Required)
                    .addExtra(
                        extra()
                            .name('Entree')
                            .description('Choose your main item')
                            .price(0)
                            .required(true)
                            .maxSelectable(1)
                            .order(1)
                            // LEVEL 2: Entree Options
                            .addExtra(
                                extra()
                                    .name('Cheeseburger')
                                    .description('Quarter pound beef patty with cheese')
                                    .price(0)
                                    .order(1)
                                    .maxSelectable(5)  // Allow multiple toppings
                                    // LEVEL 3: Burger Customizations
                                    .addExtra(
                                        extra()
                                            .name('No Pickles')
                                            .price(0)
                                            .order(1)
                                    )
                                    .addExtra(
                                        extra()
                                            .name('Extra Cheese')
                                            .description('Add another slice')
                                            .price(0.50)
                                            .order(2)
                                    )
                                    .addExtra(
                                        extra()
                                            .name('Add Bacon')
                                            .price(1.50)
                                            .order(3)
                                    )
                            )
                            .addExtra(
                                extra()
                                    .name('Grilled Chicken Sandwich')
                                    .description('Grilled chicken breast')
                                    .price(0)
                                    .order(2)
                                    .maxSelectable(3)  // Allow multiple customizations
                                    // LEVEL 3: Chicken Customizations
                                    .addExtra(
                                        extra()
                                            .name('Make it Spicy')
                                            .description('Add jalapeños and spicy sauce')
                                            .price(0)
                                            .order(1)
                                    )
                                    .addExtra(
                                        extra()
                                            .name('Gluten-Free Bun')
                                            .price(1.00)
                                            .order(2)
                                    )
                            )
                            .addExtra(
                                extra()
                                    .name('Veggie Burger')
                                    .description('Plant-based patty')
                                    .price(0)
                                    .order(3)
                            )
                    )
                    // LEVEL 1: Side Selection (Required)
                    .addExtra(
                        extra()
                            .name('Side')
                            .description('Choose your side')
                            .price(0)
                            .required(true)
                            .maxSelectable(1)
                            .order(2)
                            // LEVEL 2: Side Options
                            .addExtra(
                                extra()
                                    .name('French Fries')
                                    .price(0)
                                    .order(1)
                                    .maxSelectable(3)  // Allow multiple customizations
                                    // LEVEL 3: Fries Customizations
                                    .addExtra(
                                        extra()
                                            .name('Cajun Seasoning')
                                            .price(0)
                                            .order(1)
                                    )
                                    .addExtra(
                                        extra()
                                            .name('Cheese Sauce')
                                            .price(0.75)
                                            .order(2)
                                    )
                            )
                            .addExtra(
                                extra()
                                    .name('Onion Rings')
                                    .price(0)
                                    .order(2)
                            )
                            .addExtra(
                                extra()
                                    .name('Side Salad')
                                    .price(0)
                                    .order(3)
                            )
                    )
                    // LEVEL 1: Drink Selection (Required)
                    .addExtra(
                        extra()
                            .name('Drink')
                            .description('Choose your beverage')
                            .price(0)
                            .required(true)
                            .maxSelectable(1)
                            .order(3)
                            // LEVEL 2: Drink Options
                            .addExtra(
                                extra()
                                    .name('Fountain Soda')
                                    .description('Coke, Diet Coke, Sprite, Root Beer')
                                    .price(0)
                                    .order(1)
                            )
                            .addExtra(
                                extra()
                                    .name('Lemonade')
                                    .price(0)
                                    .order(2)
                            )
                            .addExtra(
                                extra()
                                    .name('Iced Tea')
                                    .price(0)
                                    .order(3)
                            )
                            .addExtra(
                                extra()
                                    .name('Bottled Water')
                                    .price(0)
                                    .order(4)
                            )
                    )
            )
            .addItem(
                item()
                    .name('Breakfast Combo')
                    .description('Eggs, breakfast meat, and toast')
                    .price(7.99)
                    .image('/images/menu/breakfast-combo.jpg')
                    .prepTime(12)
                    // Egg Style (Required)
                    .addExtra(
                        extra()
                            .name('Egg Style')
                            .description('How would you like your eggs?')
                            .price(0)
                            .required(true)
                            .order(1)
                            .addExtra(extra().name('Scrambled').price(0).order(1))
                            .addExtra(extra().name('Fried').price(0).order(2))
                            .addExtra(extra().name('Poached').price(0).order(3))
                    )
                    // Breakfast Meat (Required)
                    .addExtra(
                        extra()
                            .name('Breakfast Meat')
                            .price(0)
                            .required(true)
                            .order(2)
                            .addExtra(extra().name('Bacon').price(0).order(1))
                            .addExtra(extra().name('Sausage').price(0).order(2))
                            .addExtra(extra().name('Turkey Sausage').price(0.50).order(3))
                    )
                    // Toast (Required)
                    .addExtra(
                        extra()
                            .name('Toast')
                            .price(0)
                            .required(true)
                            .order(3)
                            .addExtra(extra().name('White').price(0).order(1))
                            .addExtra(extra().name('Wheat').price(0).order(2))
                            .addExtra(extra().name('Rye').price(0).order(3))
                            .addExtra(extra().name('Gluten-Free').price(1.00).order(4))
                    )
            )
    )
    .addGroup(
        group()
            .name('Burgers & Sandwiches')
            .order(1)
            .addItem(
                item()
                    .name('Cheeseburger Deluxe')
                    .description('Quarter pound beef patty with cheese, lettuce, tomato, onion')
                    .price(8.99)
                    .image('/images/menu/cheeseburger.jpg')
                    .prepTime(15)
                    .addExtra(
                        extra()
                            .name('Extra Cheese')
                            .description('Add extra melted American cheese')
                            .price(1.50)
                            .order(1)
                    )
                    .addExtra(
                        extra()
                            .name('Bacon')
                            .description('Add crispy bacon strips')
                            .price(2.00)
                            .order(2)
                    )
                    .addExtra(
                        extra()
                            .name('No Pickles')
                            .description('Remove pickles')
                            .price(0)
                            .order(3)
                    )
            )
            .addItem(
                item()
                    .name('Grilled Chicken Sandwich')
                    .description('Grilled chicken breast with lettuce, tomato, mayo')
                    .price(7.99)
                    .image('/images/menu/chicken-sandwich.jpg')
                    .addExtra(
                        extra()
                            .name('Make it Spicy')
                            .description('Add spicy sauce and jalapeños')
                            .price(0.50)
                    )
            )
            .addItem(
                item()
                    .name('Veggie Burger')
                    .description('Plant-based patty with all the fixings')
                    .price(8.49)
                    .image('/images/menu/veggie-burger.jpg')
                    .vegetarian()
                    .vegan()
            )
    )
    .addGroup(
        group()
            .name('Salads')
            .order(2)
            .addItem(
                item()
                    .name('Caesar Salad')
                    .description('Romaine lettuce, parmesan, croutons, Caesar dressing')
                    .price(6.99)
                    .image('/images/menu/caesar-salad.jpg')
                    .vegetarian()
                    .addExtra(
                        extra()
                            .name('Add Grilled Chicken')
                            .description('Add grilled chicken breast')
                            .price(3.00)
                    )
                    .addExtra(
                        extra()
                            .name('Extra Dressing')
                            .price(0.50)
                    )
            )
            .addItem(
                item()
                    .name('Garden Salad')
                    .description('Mixed greens, cucumber, tomato, carrots, choice of dressing')
                    .price(5.99)
                    .image('/images/menu/garden-salad.jpg')
                    .vegetarian()
                    .vegan()
                    .glutenFree()
            )
    )
    .addGroup(
        group()
            .name('Sides')
            .order(3)
            .addItem(
                item()
                    .name('French Fries')
                    .description('Crispy golden fries')
                    .price(3.49)
                    .image('/images/menu/fries.jpg')
                    .vegan()
                    .addExtra(
                        extra()
                            .name('Cheese Sauce')
                            .price(1.00)
                    )
                    .addExtra(
                        extra()
                            .name('Cajun Seasoning')
                            .price(0)
                    )
            )
            .addItem(
                item()
                    .name('Onion Rings')
                    .description('Beer-battered onion rings')
                    .price(4.49)
                    .image('/images/menu/onion-rings.jpg')
                    .vegetarian()
            )
    )
    .addGroup(
        group()
            .name('Drinks')
            .order(4)
            .addItem(
                item()
                    .name('Fountain Soda')
                    .description('Coke, Diet Coke, Sprite, Root Beer')
                    .price(2.49)
                    .image('/images/menu/soda.jpg')
                    .prepTime(1)
                    .maxPerOrder(5)
            )
    )
    .build();

const alfredCafe = menu()
    .restaurant('Alfred Cafe', 'Ade Hall', '+1-607-555-0300')
    .addGroup(
        group()
            .name('Coffee')
            .order(1)
            .addItem(
                item()
                    .name('Drip Coffee')
                    .description('Fresh brewed coffee')
                    .price(2.49)
                    .image('/images/menu/coffee.jpg')
                    .vegan()
                    .prepTime(2)
                    .addExtra(
                        extra()
                            .name('Oat Milk')
                            .price(0.75)
                    )
                    .addExtra(
                        extra()
                            .name('Almond Milk')
                            .price(0.75)
                    )
            )
            .addItem(
                item()
                    .name('Latte')
                    .description('Espresso with steamed milk')
                    .price(4.49)
                    .image('/images/menu/latte.jpg')
                    .vegetarian()
                    .prepTime(5)
                    .addExtra(
                        extra()
                            .name('Extra Shot')
                            .price(1.00)
                            .maxSelectable(3)
                    )
                    .addExtra(
                        extra()
                            .name('Vanilla')
                            .price(0.50)
                    )
                    .addExtra(
                        extra()
                            .name('Caramel')
                            .price(0.50)
                    )
                    .addExtra(
                        extra()
                            .name('Hazelnut')
                            .price(0.50)
                    )
            )
    )
    .addGroup(
        group()
            .name('Pastries')
            .order(2)
            .addItem(
                item()
                    .name('Blueberry Muffin')
                    .description('Fresh baked blueberry muffin')
                    .price(3.49)
                    .image('/images/menu/muffin.jpg')
                    .vegetarian()
                    .prepTime(1)
            )
            .addItem(
                item()
                    .name('Chocolate Croissant')
                    .description('Buttery croissant with chocolate')
                    .price(3.99)
                    .image('/images/menu/croissant.jpg')
                    .vegetarian()
            )
    )
    .build();

// ============================================================================
// Seed Function
// ============================================================================

async function seedMenus() {
    try {
        console.log('🌱 Connecting to database...');
        console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'NOT SET');
        console.log('Actual URI:', process.env.MONGODB_URI);
        await connectDB();

        console.log('🗑️  Clearing existing menus...');
        console.log('Database name:', mongoose.connection.db?.databaseName);
        // Try to delete, but continue if it fails
        try {
            const result = await Menu.deleteMany({});
            console.log(`   Deleted ${result.deletedCount} existing menus`);
        } catch (deleteError: any) {
            console.warn('⚠️  Could not delete existing menus:', deleteError.message);
            console.log('   Continuing with insertion...');
        }

        console.log('📝 Inserting new menus...');
        const menus = [campusGrill, alfredCafe];

        for (const menuData of menus) {
            const newMenu = await Menu.create(menuData);
            console.log(`✅ Created menu: ${newMenu.restaurant_name}`);
            console.log(`   - ${newMenu.groups.length} groups`);
            console.log(`   - ${newMenu.groups.reduce((acc: number, g: any) => acc + g.items.length, 0)} total items`);
        }

        console.log('\n🎉 Seed completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    seedMenus();
}

export { seedMenus, MenuBuilder, MenuGroupBuilder, MenuItemBuilder, MenuExtraBuilder };