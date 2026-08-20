CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`paid_at` integer,
	`items` text NOT NULL,
	`total` real NOT NULL,
	`customer_name` text NOT NULL,
	`customer_phone` text NOT NULL,
	`customer_document` text NOT NULL,
	`address_cep` text NOT NULL,
	`address_street` text NOT NULL,
	`address_number` text NOT NULL,
	`address_complement` text,
	`address_neighborhood` text NOT NULL,
	`address_reference` text,
	`notes` text,
	`transaction_id` text,
	`end_to_end` text,
	`utm_source` text,
	`utm_medium` text,
	`utm_campaign` text,
	`fbclid` text,
	`fbp` text,
	`client_ip` text,
	`user_agent` text,
	`purchase_sent_at` integer
);
--> statement-breakpoint
CREATE INDEX `orders_status_created_idx` ON `orders` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `orders_transaction_idx` ON `orders` (`transaction_id`);