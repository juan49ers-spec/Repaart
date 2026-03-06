#!/bin/bash

# Script para reparar custom claims del usuario prueba@repaart.es
# Este script actualiza el documento en Firestore, lo que activa el trigger onUserWrite
# que sincroniza automáticamente los custom claims

USER_UID="oVRUt28thDYs2UvSeMAitUdfynG3"
ROLE="franchise"
FRANCHISE_ID="F-0004"

echo "🔧 Reparando custom claims para usuario: $USER_UID"
echo ""

# Verificar que Firebase CLI está instalado
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI no está instalado"
    echo "Instálalo con: npm install -g firebase-tools"
    exit 1
fi

# Hacer login si es necesario
echo "📝 Verificando autenticación..."
firebase login --project repaartfinanzas

echo ""
echo "📝 Actualizando documento en Firestore..."
echo "  UID: $USER_UID"
echo "  Role: $ROLE"
echo "  FranchiseId: $FRANCHISE_ID"
echo ""

# Usar el comando firestore update con un timestamp para forzar el trigger
TIMESTAMP=$(date +%s)

firebase firestore:update \
  users/$USER_UID \
  --role "$ROLE" \
  --franchiseId "$FRANCHISE_ID" \
  --updatedAt "$TIMESTAMP"

echo ""
if [ $? -eq 0 ]; then
    echo "✅ Documento actualizado exitosamente"
    echo "📡 El trigger onUserWrite sincronizará los custom claims automáticamente"
    echo ""
    echo "⚠️ IMPORTANTE: Haz logout y login nuevamente en la aplicación"
else
    echo "❌ Error actualizando el documento"
    exit 1
fi
