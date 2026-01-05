class Task {
  final String id;
  final String title;
  final String? description;
  final DateTime startTime;
  final DateTime endTime;
  final String? category;
  final List<TaskMember> members;
  final bool isCompleted;
  final String? color;

  Task({
    required this.id,
    required this.title,
    this.description,
    required this.startTime,
    required this.endTime,
    this.category,
    this.members = const [],
    this.isCompleted = false,
    this.color,
  });

  factory Task.fromJson(Map<String, dynamic> json) {
    return Task(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      startTime: DateTime.parse(json['startTime'] as String),
      endTime: DateTime.parse(json['endTime'] as String),
      category: json['category'] as String?,
      members: (json['members'] as List<dynamic>?)
              ?.map((m) => TaskMember.fromJson(m as Map<String, dynamic>))
              .toList() ??
          [],
      isCompleted: json['isCompleted'] as bool? ?? false,
      color: json['color'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'startTime': startTime.toIso8601String(),
      'endTime': endTime.toIso8601String(),
      'category': category,
      'members': members.map((m) => m.toJson()).toList(),
      'isCompleted': isCompleted,
      'color': color,
    };
  }
}

class TaskMember {
  final String id;
  final String name;
  final String? avatar;

  TaskMember({
    required this.id,
    required this.name,
    this.avatar,
  });

  factory TaskMember.fromJson(Map<String, dynamic> json) {
    return TaskMember(
      id: json['id'] as String,
      name: json['name'] as String,
      avatar: json['avatar'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'avatar': avatar,
    };
  }
}
