CREATE TABLE markets(
    id VARCHAR(36) PRIMARY KEY default (UUID()),
    email VARCHAR(100) UNIQUE not null,
    name VARCHAR(60) not NULL,
    password_hash VARCHAR(255) not NULL,
    city VARCHAR(30) not null,
    district VARCHAR(30) not NULL
);

create table products (
    id varchar(36) primary key default (UUID()),
    market_id VARCHAR(36) not null,
    title varchar(100) not null,
    stock int not null,
    normal_price decimal(10, 2) not null,
    discount_price decimal(10, 2) not null,
    exp_date date not null,
    image_url VARCHAR(255),
    FOREIGN KEY (market_id) REFERENCES markets (id) on DELETE CASCADE -- if market gets deleted all of the product related with this market gets deleted
);

create table consumer (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(100) not NULL UNIQUE,
    full_name VARCHAR(100) not null,
    password_hash VARCHAR(255) not null,
    city VARCHAR(30) not null,
    district VARCHAR(30) not null
);


create table carts (
    id VARCHAR(36) PRIMARY key DEFAULT (UUID()),
    consumer_id VARCHAR(36) not null,
    FOREIGN key (consumer_id) REFERENCES consumer(id) on DELETE CASCADE
);

create table cart_items(
    id VARCHAR(36) PRIMARY key DEFAULT (UUID()),
    cart_id VARCHAR(36) not null,
    product_id VARCHAR(36) not null,
    quantity int not null check (quantity >= 1),
    FOREIGN key (cart_id) REFERENCES carts(id) on delete CASCADE,
    FOREIGN key (product_id) REFERENCES products(id) on delete CASCADE
);

