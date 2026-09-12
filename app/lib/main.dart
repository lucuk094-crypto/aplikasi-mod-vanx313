import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'config/app_config.dart';
import 'core/auth_service.dart';
import 'core/firestore_service.dart';
import 'providers/auth_provider.dart';
import 'providers/catalog_provider.dart';
import 'providers/library_provider.dart';
import 'services/download_manager.dart';
import 'ui/screens/browse_screen.dart';
import 'ui/screens/home_screen.dart';
import 'ui/screens/library_screen.dart';
import 'ui/theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: VanTheme.bg,
    systemNavigationBarIconBrightness: Brightness.light,
  ));

  final SharedPreferences prefs = await SharedPreferences.getInstance();
  final FirestoreService db = FirestoreService();
  final AuthService authService = AuthService();

  final AuthProvider auth = AuthProvider(service: authService);
  await auth.init();

  runApp(
    MultiProvider(
      providers: [
        Provider<FirestoreService>.value(value: db),
        ChangeNotifierProvider<AuthProvider>.value(value: auth),
        ChangeNotifierProvider<CatalogProvider>(
          create: (_) => CatalogProvider(db: db, prefs: prefs),
        ),
        ChangeNotifierProvider<LibraryProvider>(
          create: (_) => LibraryProvider(prefs: prefs),
        ),
        ChangeNotifierProvider<DownloadManager>(
          create: (_) => DownloadManager(db: db),
        ),
      ],
      child: const VanModApp(),
    ),
  );
}

class VanModApp extends StatelessWidget {
  const VanModApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConfig.storeName,
      debugShowCheckedModeBanner: false,
      theme: VanTheme.dark,
      darkTheme: VanTheme.dark,
      themeMode: ThemeMode.dark,
      home: const AppShell(),
    );
  }
}

/// Shell navigasi bawah: Beranda, Game, Aplikasi, Pustaka.
class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _index = 0;

  static const List<Widget> _tabs = <Widget>[
    HomeScreen(),
    BrowseScreen(collection: 'games'),
    BrowseScreen(collection: 'apps'),
    LibraryScreen(),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      Provider.of<CatalogProvider>(context, listen: false).loadInitial();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _tabs),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: VanTheme.line)),
        ),
        child: BottomNavigationBar(
        currentIndex: _index,
        onTap: (int i) => setState(() => _index = i),
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home),
              label: 'Beranda'),
          BottomNavigationBarItem(
              icon: Icon(Icons.sports_esports_outlined),
              activeIcon: Icon(Icons.sports_esports),
              label: 'Game'),
          BottomNavigationBarItem(
              icon: Icon(Icons.apps_outlined),
              activeIcon: Icon(Icons.apps),
              label: 'Aplikasi'),
          BottomNavigationBarItem(
              icon: Icon(Icons.folder_outlined),
              activeIcon: Icon(Icons.folder),
              label: 'Pustaka'),
        ],
        ),
      ),
    );
  }
}
