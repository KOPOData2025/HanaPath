package com.hanapath.backend.email;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

@Service
public class EmailService {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    private final JavaMailSender mailSender;
    
    private final Map<String, String> authCodes = new ConcurrentHashMap<>();
    private final Map<String, Long> authCodeExpiry = new ConcurrentHashMap<>();
    
    @Value("${spring.mail.username}")
    private String fromEmail;
    
    
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }
    
    /**
     * 이메일 인증번호 발송
     */
    public String sendAuthCode(String email) {
        try {
            // 인증번호 생성 (6자리)
            String authCode = generateAuthCode();
            logger.info("[{}] 인증번호 발송 시작 - 인증번호: {}", email, authCode);
            
            // 실제 이메일 발송 
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(email);
            helper.setSubject("[HanaPath] 이메일 인증번호");
            helper.setText(createEmailTemplate(authCode), true);
            
            mailSender.send(mimeMessage);
            
            // 인증번호 저장 (5분 유효)
            authCodes.put(email, authCode);
            authCodeExpiry.put(email, System.currentTimeMillis() + 300000); // 5분
            
            logger.info("이메일 인증번호 발송 완료: {} - 인증번호: {}", email, authCode);
            return "EMAIL_SENT";
            
        } catch (Exception e) {
            logger.error("이메일 발송 실패: {}", email, e);
            throw new RuntimeException("이메일 발송에 실패했습니다.", e);
        }
    }
    
    /**
     * 인증번호 확인
     */
    public boolean verifyAuthCode(String email, String inputCode) {
        try {
            String storedCode = authCodes.get(email);
            Long expiryTime = authCodeExpiry.get(email);
            
            if (storedCode == null || expiryTime == null) {
                logger.warn("인증번호가 존재하지 않거나 만료됨: {}", email);
                return false;
            }
            
            if (System.currentTimeMillis() > expiryTime) {
                logger.warn("인증번호 만료: {}", email);
                // 만료된 인증번호 제거
                authCodes.remove(email);
                authCodeExpiry.remove(email);
                return false;
            }
            
            boolean isValid = storedCode.equals(inputCode);
            
            if (isValid) {
                logger.info("이메일 인증 성공: {}", email);
                // 인증 완료 후 인증번호 제거
                authCodes.remove(email);
                authCodeExpiry.remove(email);
            } else {
                logger.warn("잘못된 인증번호: {} (입력: {}, 저장: {})", email, inputCode, storedCode);
            }
            
            return isValid;
            
        } catch (Exception e) {
            logger.error("인증번호 확인 중 오류: {}", email, e);
            return false;
        }
    }
    
    /**
     * 6자리 랜덤 인증번호 생성
     */
    private String generateAuthCode() {
        Random random = new Random();
        String authCode = String.format("%06d", random.nextInt(1000000));
        logger.info("생성된 인증번호: {}", authCode);
        return authCode;
    }
    
    
    /**
     * 인증번호 재발송
     */
    public String resendAuthCode(String email) {
        logger.info("[{}] 인증번호 재발송 요청", email);
        
        // 기존 인증번호 제거
        authCodes.remove(email);
        authCodeExpiry.remove(email);
        
        // 새 인증번호 발송
        return sendAuthCode(email);
    }
    
    /**
     * HTML 이메일 템플릿 생성
     */
    private String createEmailTemplate(String authCode) {
        return """
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>HanaPath 이메일 인증</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        line-height: 1.6;
                        color: #1d1d1f;
                        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                        min-height: 100vh;
                        padding: 40px 20px;
                    }
                        .email-wrapper {
                            max-width: 500px;
                            margin: 0 auto;
                            background: #ffffff;
                            border-radius: 24px;
                            border: 2px solid #e5e5e7;
                            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
                            overflow: hidden;
                        }
                    .header {
                        background: transparent;
                        padding: 20px 32px 20px 32px;
                        text-align: center;
                        border-bottom: 1px solid #e5e5e7;
                    }
                    .brand-logo {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 20px;
                    }
                    .logo-img {
                        width: 48px;
                        height: 48px;
                        border-radius: 0;
                        background: transparent;
                        padding: 0;
                        box-shadow: none;
                        border: none;
                        margin-right: 10px;
                    }
                    .brand-name {
                        font-size: 28px;
                        font-weight: 700;
                        color: #009178;
                        margin: 0;
                        letter-spacing: -0.5px;
                    }
                    .header-title {
                        font-size: 20px;
                        font-weight: 600;
                        color: #1d1d1f;
                        margin: 0;
                        opacity: 0.8;
                    }
                    .content {
                        padding: 24px 32px 32px 32px;
                    }
                    .greeting {
                        font-size: 18px;
                        font-weight: 500;
                        color: #1d1d1f;
                        margin-bottom: 16px;
                    }
                    .greeting-text {
                        display: block;
                    }
                    .main-title {
                        font-size: 24px;
                        font-weight: 600;
                        color: #1d1d1f;
                        margin-bottom: 12px;
                        line-height: 1.4;
                    }
                    .description {
                        font-size: 16px;
                        font-weight: 400;
                        color: #6e6e73;
                        margin-bottom: 24px;
                        line-height: 1.6;
                    }
                    .auth-code {
                        font-size: 28px;
                        font-weight: 700;
                        color: #009178;
                        letter-spacing: 6px;
                        font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        margin: 24px auto;
                        background: #ffffff;
                        padding: 24px 32px;
                        border-radius: 20px;
                        border: 3px solid #009178;
                        display: block;
                        width: fit-content;
                        text-align: center;
                        box-shadow: none;
                        position: relative;
                        overflow: hidden;
                    }
                    .auth-code::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: -100%;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                        transition: left 0.5s;
                    }
                    .warning-section {
                        background: #f0f9f4;
                        border-radius: 12px;
                        padding: 16px;
                        margin: 20px 0;
                    }
                    .warning-text {
                        font-size: 14px;
                        font-weight: 500;
                        color: #009178;
                        margin: 0;
                        line-height: 1.4;
                        text-align: center;
                    }
                    .disclaimer {
                        font-size: 13px;
                        font-weight: 400;
                        color: #6b7280;
                        margin: 20px 0;
                        line-height: 1.5;
                        text-align: center;
                    }
                    .disclaimer a {
                        color: #009178;
                        text-decoration: none;
                        font-weight: 500;
                    }
                    .footer {
                        background: #f8f9fa;
                        padding: 24px 32px;
                        text-align: center;
                        border-top: 1px solid #e5e5e7;
                    }
                    .footer-text {
                        font-size: 12px;
                        font-weight: 400;
                        color: #8e8e93;
                        margin: 0;
                    }
                        /* PC 최적화 */
                        @media (min-width: 768px) {
                            .email-wrapper {
                                max-width: 500px;
                                margin: 40px auto;
                            }
                            .header {
                                padding: 24px 40px;
                            }
                            .content {
                                padding: 32px 40px;
                            }
                            .greeting-text {
                                display: block;
                            }
                        .auth-section {
                            padding: 48px 40px;
                        }
                        .auth-code {
                            font-size: 40px;
                            letter-spacing: 10px;
                            min-width: 320px;
                        }
                        .brand-name {
                            font-size: 32px;
                        }
                        .header-title {
                            font-size: 22px;
                        }
                        .main-title {
                            font-size: 28px;
                        }
                    }
                    
                        /* 태블릿 최적화 */
                        @media (max-width: 767px) and (min-width: 481px) {
                            body {
                                padding: 24px 16px;
                            }
                            .email-wrapper {
                                border-radius: 20px;
                            }
                            .header {
                                padding: 20px 28px;
                            }
                            .content {
                                padding: 28px 28px;
                            }
                        .auth-section {
                            padding: 36px 28px;
                        }
                        .auth-code {
                            font-size: 32px;
                            letter-spacing: 8px;
                            min-width: 280px;
                        }
                        .brand-name {
                            font-size: 26px;
                        }
                        .main-title {
                            font-size: 22px;
                        }
                    }
                    
                    /* 모바일 최적화 */
                    @media (max-width: 480px) {
                        body {
                            padding: 16px 12px;
                            background: #f8f9fa;
                        }
                        .email-wrapper {
                            border-radius: 16px;
                            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
                        }
                        .header {
                            padding: 28px 20px;
                        }
                        .content {
                            padding: 32px 20px;
                        }
                        .auth-section {
                            padding: 28px 20px;
                            margin: 24px 0;
                        }
                        .auth-code {
                            font-size: 28px;
                            letter-spacing: 6px;
                            min-width: 220px;
                            padding: 20px;
                        }
                        .brand-name {
                            font-size: 24px;
                        }
                        .header-title {
                            font-size: 18px;
                        }
                        .main-title {
                            font-size: 20px;
                        }
                        .description {
                            font-size: 15px;
                        }
                        .warning-section {
                            padding: 16px;
                            margin: 20px 0;
                        }
                        .warning-text {
                            font-size: 13px;
                        }
                        .disclaimer {
                            font-size: 12px;
                            margin: 20px 0;
                        }
                        .support {
                            font-size: 13px;
                            margin: 16px 0;
                        }
                        .signature {
                            font-size: 15px;
                            margin-top: 24px;
                        }
                        .footer {
                            padding: 20px;
                        }
                        .footer-text {
                            font-size: 11px;
                        }
                    }
                </style>
            </head>
                <body>
                    <div class="email-wrapper" style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 2px solid #e5e5e7; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05); overflow: hidden;">
                        <div class="header" style="background: transparent; padding: 20px 32px 20px 32px; text-align: center; border-bottom: 1px solid #e5e5e7;">
                            <div class="brand-logo" style="display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                                <img src="https://www.hanafn.com/assets/img/ko/info/img-hana-symbol.png" alt="Hana" class="logo-img" style="width: 48px; height: 48px; border-radius: 0; background: transparent; padding: 0; box-shadow: none; border: none; margin-right: 20px;">
                                <h1 class="brand-name" style="font-size: 28px; font-weight: 700; color: #009178; margin: 0; letter-spacing: -0.5px; text-align: center; margin-left: 16px;">HanaPath</h1>
                            </div>
                            <h2 class="header-title" style="font-size: 20px; font-weight: 600; color: #1d1d1f; margin: 0; opacity: 0.8;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#009178" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 8px;">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                                이메일 인증
                            </h2>
                        </div>
                    
                    <div class="content" style="padding: 24px 32px 32px 32px;">
                        <div class="greeting" style="font-size: 16px; font-weight: 500; color: #1d1d1f; margin-bottom: 16px; text-align: center;">
                            <span class="greeting-text">안녕하세요, HanaPath 계정 생성을 위해<br>아래 인증코드를 입력해주세요.</span>
                        </div>
                        
                        <div class="auth-code" style="font-size: 28px; font-weight: 700; color: #009178; letter-spacing: 6px; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 24px auto; background: #ffffff; padding: 24px 32px; border-radius: 20px; border: 3px solid #009178; display: block; width: fit-content; text-align: center; box-shadow: none; position: relative; overflow: hidden;">%s</div>
                        
                        <div class="warning-section" style="background: #f0f9f4; border-radius: 12px; padding: 16px; margin: 20px 0;">
                            <div class="warning-text" style="font-size: 14px; font-weight: 500; color: #009178; margin: 0; line-height: 1.4; text-align: center;">
                                이 인증코드는 5분 후 만료됩니다.
                            </div>
                        </div>
                        
                        <div class="disclaimer" style="font-size: 13px; font-weight: 400; color: #6b7280; margin: 20px 0; line-height: 1.5; text-align: center;">
                            본인이 요청하지 않은 경우 이 메일을 무시하세요.<br>
                            문의사항이 있으시면 <a href="mailto:support@hanapath.com" style="color: #009178; text-decoration: none; font-weight: 500;">support@hanapath.com</a>으로 연락해주세요.
                        </div>
                    </div>
                    
                    <div class="footer" style="background: #f8f9fa; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e5e7;">
                        <p class="footer-text" style="font-size: 12px; font-weight: 400; color: #8e8e93; margin: 0;">
                            © 2025 HanaPath. All rights reserved.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """.replace("%s", authCode);
    }
}
