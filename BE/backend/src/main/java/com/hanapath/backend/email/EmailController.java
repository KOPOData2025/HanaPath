package com.hanapath.backend.email;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/email")
public class EmailController {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailController.class);
    
    private final EmailService emailService;
    
    public EmailController(EmailService emailService) {
        this.emailService = emailService;
    }
    
    @PostMapping("/send-auth-code")
    public ResponseEntity<Map<String, Object>> sendAuthCode(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("이메일을 입력해주세요."));
            }
            
            logger.info("이메일 인증번호 발송 요청: {}", email);
            
            String result = emailService.sendAuthCode(email);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "인증번호가 발송되었습니다.");
            response.put("result", result);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("이메일 발송 API 오류", e);
            return ResponseEntity.internalServerError()
                .body(createErrorResponse("이메일 발송에 실패했습니다."));
        }
    }

    @PostMapping("/verify-auth-code")
    public ResponseEntity<Map<String, Object>> verifyAuthCode(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String authCode = request.get("authCode");
            
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("이메일을 입력해주세요."));
            }
            
            if (authCode == null || authCode.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("인증번호를 입력해주세요."));
            }
            
            logger.info("인증번호 확인 요청: {} - {}", email, authCode);
            
            boolean isValid = emailService.verifyAuthCode(email, authCode);
            
            Map<String, Object> response = new HashMap<>();
            
            if (isValid) {
                response.put("success", true);
                response.put("message", "이메일 인증이 완료되었습니다.");
                response.put("verified", true);
            } else {
                response.put("success", false);
                response.put("message", "인증번호가 올바르지 않거나 만료되었습니다.");
                response.put("verified", false);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("인증번호 확인 API 오류", e);
            return ResponseEntity.internalServerError()
                .body(createErrorResponse("인증번호 확인 중 오류가 발생했습니다."));
        }
    }
    
    @PostMapping("/resend-auth-code")
    public ResponseEntity<Map<String, Object>> resendAuthCode(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("이메일을 입력해주세요."));
            }
            
            logger.info("인증번호 재발송 요청: {}", email);
            
            String result = emailService.resendAuthCode(email);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "인증번호가 재발송되었습니다.");
            response.put("result", result);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("인증번호 재발송 API 오류", e);
            return ResponseEntity.internalServerError()
                .body(createErrorResponse("인증번호 재발송에 실패했습니다."));
        }
    }
    
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return response;
    }
}
