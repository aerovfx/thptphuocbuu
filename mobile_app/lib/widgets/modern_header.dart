import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ModernHeader extends StatelessWidget {
  final String greeting;
  final String userName;
  final String? avatarUrl;
  final VoidCallback? onAvatarTap;
  final VoidCallback? onSettingsTap;

  const ModernHeader({
    super.key,
    required this.greeting,
    required this.userName,
    this.avatarUrl,
    this.onAvatarTap,
    this.onSettingsTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
      ),
      child: Row(
        children: [
          // Avatar
          GestureDetector(
            onTap: onAvatarTap,
            child: Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: theme.primaryColor.withOpacity(0.2),
                  width: 2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: ClipOval(
                child: avatarUrl != null
                    ? Image.network(
                        avatarUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return _buildDefaultAvatar(theme);
                        },
                      )
                    : _buildDefaultAvatar(theme),
              ),
            ),
          ),
          const SizedBox(width: 16),
          // Greeting and Name
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Text(
                      greeting,
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        color: theme.colorScheme.onSurface.withOpacity(0.7),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '👋',
                      style: const TextStyle(fontSize: 16),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  userName,
                  style: GoogleFonts.outfit(
                    fontSize: 22,
                    color: theme.colorScheme.onSurface,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          // Settings Icon
          if (onSettingsTap != null)
            IconButton(
              onPressed: onSettingsTap,
              icon: Icon(
                Icons.settings_outlined,
                color: theme.colorScheme.onSurface.withOpacity(0.6),
                size: 26,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildDefaultAvatar(ThemeData theme) {
    return Container(
      color: theme.primaryColor.withOpacity(0.1),
      child: Icon(
        Icons.person,
        size: 28,
        color: theme.primaryColor,
      ),
    );
  }
}
