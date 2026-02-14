
package com.vmitra.backend;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * V mitra - Official Java Business Brain
 * Developed by: Shivam Shukla
 * Mission: Empowering Indian Small Businesses with Voice AI.
 */

public class VmitraApplication {

    // --- SERVICE LAYER: Business Logic ---
    
    public static class VmitraService {
        
        // Dictionary for Hinglish to English Mapping
        private final Map<String, String> hingeDictionary = new HashMap<>() {{
            put("cheeni", "sugar");
            put("doodh", "milk");
            put("tel", "oil");
            put("chawal", "rice");
            put("sabun", "soap");
            put("atta", "atta");
            put("dahi", "curd");
            put("namak", "salt");
        }};

        /**
         * Hinglish Fuzzy Matching: Checks if user input matches inventory items.
         */
        public boolean isProductMatch(String userInput, String inventoryName) {
            String input = userInput.toLowerCase();
            String item = inventoryName.toLowerCase();
            
            if (item.contains(input) || input.contains(item)) return true;
            
            // Check dictionary mappings
            for (Map.Entry<String, String> entry : hingeDictionary.entrySet()) {
                if (input.contains(entry.getKey()) && item.contains(entry.getValue())) {
                    return true;
                }
            }
            return false;
        }

        /**
         * Record a Sale: Processes transaction and updates stock.
         */
        public TransactionResult processSale(List<SaleItemRequest> requests, List<InventoryItem> inventory) {
            double totalAmount = 0;
            double totalCost = 0;
            List<SaleItem> processedItems = new ArrayList<>();
            boolean matched = false;

            for (SaleItemRequest req : requests) {
                Optional<InventoryItem> match = inventory.stream()
                        .filter(inv -> isProductMatch(req.name, inv.name))
                        .findFirst();

                if (match.isPresent()) {
                    matched = true;
                    InventoryItem item = match.get();
                    int qty = Math.min(req.quantity, item.stock);
                    
                    if (qty > 0) {
                        item.stock -= qty;
                        processedItems.add(new SaleItem(item.name, qty, item.price, item.costPrice));
                        totalAmount += item.price * qty;
                        totalCost += item.costPrice * qty;
                    }
                }
            }

            if (!matched || processedItems.isEmpty()) {
                return new TransactionResult(false, "Samaan nahi mila ya stock khatam hai.", 0, 0);
            }

            return new TransactionResult(true, "Bill save ho gaya!", totalAmount, totalAmount - totalCost);
        }

        /**
         * AI System Prompt Generation for Gemini
         */
        public String getSystemInstruction() {
            return "You are V mitra, a professional Voice AI for Indian merchants. " +
                   "Language: Natural Hinglish. Persona: Respectful business partner. " +
                   "Key Tasks: Record sales (Hisaab), Check Profit (Nafa), Alert Low Stock.";
        }
    }

    // --- DATA MODELS ---

    public static class InventoryItem {
        public String id;
        public String name;
        public String category;
        public int stock;
        public String unit;
        public double price;
        public double costPrice;

        public InventoryItem(String id, String name, String category, int stock, String unit, double price, double costPrice) {
            this.id = id;
            this.name = name;
            this.category = category;
            this.stock = stock;
            this.unit = unit;
            this.price = price;
            this.costPrice = costPrice;
        }
    }

    public static class SaleItemRequest {
        public String name;
        public int quantity;
    }

    public static class SaleItem {
        public String name;
        public int quantity;
        public double price;
        public double costPrice;

        public SaleItem(String name, int quantity, double price, double costPrice) {
            this.name = name;
            this.quantity = quantity;
            this.price = price;
            this.costPrice = costPrice;
        }
    }

    public static class TransactionResult {
        public boolean success;
        public String message;
        public double amount;
        public double profit;

        public TransactionResult(boolean success, String message, double amount, double profit) {
            this.success = success;
            this.message = message;
            this.amount = amount;
            this.profit = profit;
        }
    }
}
