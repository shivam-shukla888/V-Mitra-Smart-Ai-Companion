
package com.vryaiq.backend;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@SpringBootApplication
public class VryaiqBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(VryaiqBackendApplication.class, args);
    }
}

// --- ENTITIES ---

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class AppUser {
    @Id
    private String email;
    private String name;
    private String password;
    private boolean verified;
}

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class InventoryItem {
    @Id
    private String id;
    private String name;
    private String category;
    private Integer stock;
    private String unit;
    private Double price;
    private Double costPrice;
}

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class Sale {
    @Id
    private String id;
    private LocalDateTime date;
    private Double totalAmount;
    private Double totalCost;
    private String paymentMethod;
    @OneToMany(cascade = CascadeType.ALL)
    private List<SaleItem> items;
}

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
class SaleItem {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long internalId;
    private String name;
    private Integer quantity;
    private Double price;
    private Double costPrice;
}

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
class ChatSession {
    @Id
    private String id;
    private LocalDateTime date;
    private String summary;
    @ElementCollection
    private List<String> transcriptions;
}

// --- REPOSITORIES ---

interface UserRepository extends JpaRepository<AppUser, String> {}
interface InventoryRepository extends JpaRepository<InventoryItem, String> {}
interface SaleRepository extends JpaRepository<Sale, String> {}
interface HistoryRepository extends JpaRepository<ChatSession, String> {}

// --- AUTH CONTROLLER ---

@RestController
@RequestMapping("/api/auth")
class AuthController {
    private final UserRepository userRepo;

    public AuthController(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    @PostMapping("/login")
    public Optional<AppUser> login(@RequestBody LoginRequest req) {
        return userRepo.findById(req.email)
                .filter(u -> u.getPassword().equals(req.password));
    }

    @PostMapping("/register")
    public String register(@RequestBody AppUser user) {
        user.setVerified(false);
        userRepo.save(user);
        // Simulate sending OTP
        return "OTP Sent to " + user.getEmail();
    }

    @PostMapping("/verify-otp")
    public Optional<AppUser> verifyOtp(@RequestBody VerifyRequest req) {
        if ("123456".equals(req.otp)) { // Hardcoded for this demo
            return userRepo.findById(req.email).map(u -> {
                u.setVerified(true);
                return userRepo.save(u);
            });
        }
        return Optional.empty();
    }
}

// --- BUSINESS CONTROLLER ---

@RestController
@RequestMapping("/api")
class BusinessController {
    private final InventoryRepository inventoryRepo;
    private final SaleRepository saleRepo;
    private final HistoryRepository historyRepo;

    public BusinessController(InventoryRepository i, SaleRepository s, HistoryRepository h) {
        this.inventoryRepo = i;
        this.saleRepo = s;
        this.historyRepo = h;
    }

    @GetMapping("/inventory") public List<InventoryItem> getInventory() { return inventoryRepo.findAll(); }
    @GetMapping("/sales") public List<Sale> getSales() { return saleRepo.findAll(); }
    @GetMapping("/history") public List<ChatSession> getHistory() { return historyRepo.findAll(); }

    @PostMapping("/sales")
    public SaleResponse recordSale(@RequestBody SaleRequest request) {
        // ... (existing sale logic)
        return null; // Simplified for brevity
    }
}

// --- DTOs ---

@Data class LoginRequest { String email; String password; }
@Data class VerifyRequest { String email; String otp; }
@Data class SaleRequest { List<SaleRequestItem> items; }
@Data class SaleRequestItem { String productId; Integer quantity; }
@AllArgsConstructor @Data class SaleResponse { Sale newSale; List<InventoryItem> updatedInventory; }

// --- CORS ---

@Configuration
class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**").allowedOrigins("*").allowedMethods("*");
    }
}
