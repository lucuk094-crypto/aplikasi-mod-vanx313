import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../theme.dart';
import '../widgets.dart';

/// Masuk / Daftar / Reset password.
class AuthScreen extends StatelessWidget {
  const AuthScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Akun VAN MOD'),
          bottom: const TabBar(
            tabs: <Widget>[
              Tab(text: 'MASUK'),
              Tab(text: 'DAFTAR'),
            ],
          ),
        ),
        body: const TabBarView(
          children: <Widget>[
            _SignInForm(),
            _SignUpForm(),
          ],
        ),
      ),
    );
  }
}

class _SignInForm extends StatefulWidget {
  const _SignInForm();
  @override
  State<_SignInForm> createState() => _SignInFormState();
}

class _SignInFormState extends State<_SignInForm> {
  final TextEditingController _email = TextEditingController();
  final TextEditingController _pass = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _email.dispose();
    _pass.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final AuthProvider auth =
        Provider.of<AuthProvider>(context, listen: false);
    final bool ok = await auth.signIn(_email.text, _pass.text);
    if (!mounted) return;
    if (ok) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Selamat datang kembali!')),
      );
    }
  }

  Future<void> _reset() async {
    if (_email.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Isi email dulu untuk reset password.')),
      );
      return;
    }
    final AuthProvider auth =
        Provider.of<AuthProvider>(context, listen: false);
    final bool ok = await auth.sendReset(_email.text);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
          content: Text(ok
              ? 'Link reset dikirim ke ${_email.text.trim()}.'
              : (auth.error ?? 'Gagal mengirim link reset.'))),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (BuildContext ctx, AuthProvider auth, _) {
        return ListView(
          padding: const EdgeInsets.all(20),
          children: <Widget>[
            const Kicker('// IDENTIFIKASI PENGGUNA'),
            const SizedBox(height: 16),
            TextField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: 'Email',
                prefixIcon: Icon(Icons.email_outlined),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _pass,
              obscureText: _obscure,
              decoration: InputDecoration(
                labelText: 'Password',
                prefixIcon: const Icon(Icons.lock_outline),
                suffixIcon: IconButton(
                  onPressed: () =>
                      setState(() => _obscure = !_obscure),
                  icon: Icon(_obscure
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined),
                ),
              ),
              onSubmitted: (_) => _submit(),
            ),
            if (auth.error != null) ...<Widget>[
              const SizedBox(height: 8),
              Text(auth.error!,
                  style: const TextStyle(
                      color: VanTheme.danger, fontSize: 12)),
            ],
            const SizedBox(height: 16),
            NeonButton(
              label: auth.busy ? 'Memproses…' : 'Masuk',
              icon: Icons.login,
              onPressed: auth.busy ? null : _submit,
            ),
            const SizedBox(height: 8),
            Center(
              child: TextButton(
                onPressed: auth.busy ? null : _reset,
                child: const Text('LUPA PASSWORD?'),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _SignUpForm extends StatefulWidget {
  const _SignUpForm();
  @override
  State<_SignUpForm> createState() => _SignUpFormState();
}

class _SignUpFormState extends State<_SignUpForm> {
  final TextEditingController _name = TextEditingController();
  final TextEditingController _email = TextEditingController();
  final TextEditingController _pass = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _pass.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_name.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Isi nama tampilan dulu.')),
      );
      return;
    }
    final AuthProvider auth =
        Provider.of<AuthProvider>(context, listen: false);
    final bool ok =
        await auth.signUp(_name.text, _email.text, _pass.text);
    if (!mounted) return;
    if (ok) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Akun dibuat. Selamat bergabung!')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (BuildContext ctx, AuthProvider auth, _) {
        return ListView(
          padding: const EdgeInsets.all(20),
          children: <Widget>[
            const Kicker('// REGISTRASI OPERATOR BARU'),
            const SizedBox(height: 16),
            TextField(
              controller: _name,
              decoration: const InputDecoration(
                labelText: 'Nama tampilan',
                prefixIcon: Icon(Icons.person_outline),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: 'Email',
                prefixIcon: Icon(Icons.email_outlined),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _pass,
              obscureText: _obscure,
              decoration: InputDecoration(
                labelText: 'Password (min. 6 karakter)',
                prefixIcon: const Icon(Icons.lock_outline),
                suffixIcon: IconButton(
                  onPressed: () =>
                      setState(() => _obscure = !_obscure),
                  icon: Icon(_obscure
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined),
                ),
              ),
              onSubmitted: (_) => _submit(),
            ),
            if (auth.error != null) ...<Widget>[
              const SizedBox(height: 8),
              Text(auth.error!,
                  style: const TextStyle(
                      color: VanTheme.danger, fontSize: 12)),
            ],
            const SizedBox(height: 16),
            NeonButton(
              label: auth.busy ? 'Memproses…' : 'Daftar',
              icon: Icons.person_add_outlined,
              onPressed: auth.busy ? null : _submit,
            ),
          ],
        );
      },
    );
  }
}
