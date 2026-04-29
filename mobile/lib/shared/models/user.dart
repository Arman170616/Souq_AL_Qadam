class User {
  final int id;
  final String email;
  final String firstName;
  final String lastName;
  final String role; // customer | vendor | admin
  final String? phone;
  final String? avatar;

  const User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.phone,
    this.avatar,
  });

  String get fullName => '$firstName $lastName'.trim();
  bool get isVendor  => role == 'vendor';
  bool get isAdmin   => role == 'admin';
  bool get isCustomer => role == 'customer';

  factory User.fromJson(Map<String, dynamic> j) => User(
    id:        j['id'],
    email:     j['email'],
    firstName: j['first_name'] ?? '',
    lastName:  j['last_name']  ?? '',
    role:      j['role'] ?? 'customer',
    phone:     j['phone'],
    avatar:    j['avatar'],
  );
}
