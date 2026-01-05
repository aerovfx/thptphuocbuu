import 'package:flutter/material.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/auth_service.dart';
import '../../services/post_service.dart';
import '../../models/user.dart';

class CreatePostScreen extends StatefulWidget {
  const CreatePostScreen({super.key});

  @override
  State<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends State<CreatePostScreen> {
  final TextEditingController _contentController = TextEditingController();
  final List<File> _selectedImages = [];
  File? _selectedVideo;
  bool _isPosting = false;
  final ImagePicker _picker = ImagePicker();
  User? _currentUser;

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final user = await AuthService.getCurrentUser();
    if (mounted) {
      setState(() {
        _currentUser = user;
      });
    }
  }

  @override
  void dispose() {
    _contentController.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    if (_selectedVideo != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không thể thêm ảnh khi đã có video')),
      );
      return;
    }

    final List<XFile> images = await _picker.pickMultiImage();
    if (images.length + _selectedImages.length > 4) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tối đa 4 ảnh')),
        );
      }
      return;
    }

    setState(() {
      _selectedImages.addAll(images.map((img) => File(img.path)));
    });
  }

  Future<void> _pickVideo() async {
    if (_selectedImages.isNotEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không thể thêm video khi đã có ảnh')),
      );
      return;
    }

    final XFile? video = await _picker.pickVideo(source: ImageSource.gallery);
    if (video != null) {
      setState(() {
        _selectedVideo = File(video.path);
      });
    }
  }

  void _removeImage(int index) {
    setState(() {
      _selectedImages.removeAt(index);
    });
  }

  void _removeVideo() {
    setState(() {
      _selectedVideo = null;
    });
  }

  Future<void> _post() async {
    final content = _contentController.text.trim();

    if (content.isEmpty && _selectedImages.isEmpty && _selectedVideo == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập nội dung hoặc chọn ảnh/video')),
      );
      return;
    }

    setState(() {
      _isPosting = true;
    });

    try {
      final result = await PostService.createPost(
        content: content,
        images: _selectedImages,
        video: _selectedVideo,
      );

      if (!mounted) return;

      if (result['success'] == true) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đăng bài thành công!'),
            backgroundColor: Colors.teal,
          ),
        );
      } else {
        setState(() {
          _isPosting = false;
        });
        
        if (result['needsRelogin'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['error'] ?? 'Phiên đăng nhập hết hạn'),
              backgroundColor: Colors.orange,
            ),
          );
          Future.delayed(const Duration(seconds: 1), () {
            if (mounted) {
              Navigator.of(context).pushNamedAndRemoveUntil('/', (route) => false);
            }
          });
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['error'] ?? 'Đăng bài thất bại'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isPosting = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final bool canPost = (_contentController.text.trim().isNotEmpty ||
            _selectedImages.isNotEmpty ||
            _selectedVideo != null) &&
        !_isPosting;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text('Tạo bài viết', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        elevation: 0,
        actions: [
          Padding(
            padding: const EdgeInsets.all(10.0),
            child: ElevatedButton(
              onPressed: canPost ? _post : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.teal,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                elevation: 0,
              ),
              child: _isPosting
                  ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.white)))
                  : const Text('Đăng', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // User Header
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 20,
                        backgroundImage: _currentUser?.avatar != null ? NetworkImage(_currentUser!.avatar!) : null,
                        child: _currentUser?.avatar == null ? Text(_currentUser?.fullName[0].toUpperCase() ?? 'U') : null,
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_currentUser?.fullName ?? 'Đang tải...', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
                          Row(
                            children: [
                              const Icon(Icons.public, size: 12, color: Colors.grey),
                              const SizedBox(width: 4),
                              Text('Công khai', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey)),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  
                  // Content TextField
                  TextField(
                    controller: _contentController,
                    maxLines: null,
                    decoration: InputDecoration(
                      hintText: 'Bạn đang nghĩ gì vậy ${_currentUser?.firstName ?? ''}?',
                      border: InputBorder.none,
                      hintStyle: GoogleFonts.inter(fontSize: 18, color: Colors.grey),
                    ),
                    style: GoogleFonts.inter(fontSize: 18),
                    onChanged: (_) => setState(() {}),
                  ),
                  const SizedBox(height: 16),

                  // Selected Images/Video
                  if (_selectedImages.isNotEmpty) _buildImageGrid(),
                  if (_selectedVideo != null) _buildVideoPreview(),
                ],
              ),
            ),
          ),

          // Bottom Toolbar
          _buildToolbar(theme),
        ],
      ),
    );
  }

  Widget _buildImageGrid() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: _selectedImages.length == 1 ? 1 : 2,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
        childAspectRatio: 1,
      ),
      itemCount: _selectedImages.length,
      itemBuilder: (context, index) {
        return Stack(
          fit: StackFit.expand,
          children: [
            ClipRRect(borderRadius: BorderRadius.circular(12), child: Image.file(_selectedImages[index], fit: BoxFit.cover)),
            Positioned(
              top: 8, right: 8,
              child: _buildRemoveButton(() => _removeImage(index)),
            ),
          ],
        );
      },
    );
  }

  Widget _buildVideoPreview() {
    return Stack(
      children: [
        Container(
          width: double.infinity, height: 200,
          decoration: BoxDecoration(color: Colors.black, borderRadius: BorderRadius.circular(12)),
          child: const Center(child: Icon(Icons.play_circle_outline, size: 64, color: Colors.white)),
        ),
        Positioned(top: 8, right: 8, child: _buildRemoveButton(_removeVideo)),
      ],
    );
  }

  Widget _buildRemoveButton(VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(color: Colors.black.withOpacity(0.6), shape: BoxShape.circle),
        child: const Icon(Icons.close, color: Colors.white, size: 20),
      ),
    );
  }

  Widget _buildToolbar(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: theme.cardColor,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))],
      ),
      child: Row(
        children: [
          _buildToolbarIcon(Icons.image_outlined, Colors.teal, _pickImages),
          _buildToolbarIcon(Icons.videocam_outlined, Colors.deepPurple, _pickVideo),
          _buildToolbarIcon(Icons.location_on_outlined, Colors.red, () {}),
          _buildToolbarIcon(Icons.emoji_emotions_outlined, Colors.amber, () {}),
          const Spacer(),
          if (_selectedImages.isNotEmpty)
            Text('${_selectedImages.length}/4', style: GoogleFonts.inter(color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildToolbarIcon(IconData icon, Color color, VoidCallback onTap) {
    return IconButton(
      icon: Icon(icon, color: color, size: 28),
      onPressed: _isPosting ? null : onTap,
    );
  }
}
