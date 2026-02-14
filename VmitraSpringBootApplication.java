
package com.vmitra.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.context.annotation.Bean;
import lombok.*;
import java.time.LocalDateTime;
import java.util.*;

/**
 * V mitra - Professional Spring Boot Business Brain
 * Developed by: Shivam Shukla
 */

@SpringBootApplication
public class VmitraSpringBootApplication {
    public static void main(String[] args) {
        // Standard Spring Boot Entry Point
        System.out.println("V mitra Spring Boot Backend starting...");
    }
}

// --- CONTROLLER LAYER ---

@RestController
@RequestMapping("/api/v1/business")
@CrossOrigin(origins = "*") // For local development
class VmitraController {
    private final VmitraService vmitraService;

    public VmitraController(VmitraService vmitraService) {
        this.vmitraService = vmitraService;
    }

    @GetMapping("/stats")
    public Map<String, Object> getDashboardStats() {
        return vmitraService.calculateLiveStats();
    }

    @PostMapping("/record-sale")
    public TransactionResponse recordSale(@RequestBody SaleRequest request) {
        return vmitraService.processSaleTransaction(request);
    }

    @GetMapping("/inventory")
    public List<InventoryItem> getFullInventory() {
        return vmitraService.getInventory();
    }
}

// --- SERVICE LAYER (THE BRAIN) ---

@Service
class VmitraService {
    // Mocking a Database for this environment
    private List<InventoryItem> inventory = new ArrayList<>();
    private List<Sale> sales = new ArrayList<>();

    // Hinglish Mapping Dictionary
    private final Map<String, String> translationMap = Map.of(
        "cheeni", "sugar",
        "doodh", "milk",
        "tel", "oil",
        "atta", "atta",
        "sabun", "soap"
    );

    public Map<String, Object> calculateLiveStats() {
        double todaySales = sales.stream().mapToDouble(Sale::getTotalAmount).sum();
        double todayProfit = sales.stream().mapToDouble(s -> s.getTotalAmount() - s.getTotalCost()).sum();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("todaySales", todaySales);
        stats.put("todayProfit", todayProfit);
        stats.put("lowStockCount", inventory.stream().filter(i -> i.getStock() < 10).count());
        return stats;
    }

    public TransactionResponse processSaleTransaction(SaleRequest request) {
        // Business Logic for Transaction processing
        double totalAmt = 0;
        double totalCst = 0;
        
        for (SaleItemRequest itemReq : request.getItems()) {
            InventoryItem item = findItemByFuzzyName(itemReq.getName());
            if (item != null && item.getStock() >= itemReq.getQuantity()) {
                item.setStock(item.getStock() - itemReq.getQuantity());
                totalAmt += item.getPrice() * itemReq.getQuantity();
                totalCst += item.getCostPrice() * itemReq.getQuantity();
            }
        }

        if (totalAmt > 0) {
            Sale newSale = new Sale(UUID.randomUUID().toString(), LocalDateTime.now(), totalAmt, totalCst);
            sales.add(newSale);
            return new TransactionResponse(true, "Bikri Record ho gayi: ₹" + totalAmt, totalAmt);
        }
        
        return new TransactionResponse(false, "Samaan nahi mila.", 0);
    }

    private InventoryItem findItemByFuzzyName(String query) {
        String q = query.toLowerCase();
        return inventory.stream()
            .filter(i -> i.getName().toLowerCase().contains(q) || 
                         (translationMap.containsKey(q) && i.getName().toLowerCase().contains(translationMap.get(q))))
            .findFirst().orElse(null);
    }

    public List<InventoryItem> getInventory() { return inventory; }
}

// --- DATA MODELS / ENTITIES ---

@Data
@AllArgsConstructor
class InventoryItem {
    private String id;
    private String name;
    private int stock;
    private double price;
    private double costPrice;
}

@Data
@AllArgsConstructor
class Sale {
    private String id;
    private LocalDateTime timestamp;
    private double totalAmount;
    private double totalCost;
}

@Data
class SaleRequest {
    private List<SaleItemRequest> items;
}

@Data
class SaleItemRequest {
    private String name;
    private int quantity;
}

@Data
@AllArgsConstructor
class TransactionResponse {
    private boolean success;
    private String message;
    private double amount;
}
